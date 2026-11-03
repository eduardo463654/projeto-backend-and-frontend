import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';
import { Pool } from 'pg';

async function bootstrapAdmin() {
  const name = process.env.ADMIN_NAME?.trim();
  const phone = process.env.ADMIN_PHONE?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const connectionString = process.env.DATABASE_URL;

  if (!name || !phone || !email || !password || !connectionString) {
    throw new Error(
      'Configure ADMIN_NAME, ADMIN_PHONE, ADMIN_EMAIL, ADMIN_PASSWORD e DATABASE_URL no ambiente.',
    );
  }

  if (password.length < 12) {
    throw new Error('ADMIN_PASSWORD precisa ter pelo menos 12 caracteres.');
  }

  const pool = new Pool({ connectionString });
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtext('labfap-admin-bootstrap'))",
    );

    const admins = await client.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM users WHERE role = 'admin'",
    );
    if (Number(admins.rows[0]?.count ?? 0) > 0) {
      throw new Error('Já existe um administrador; o bootstrap foi bloqueado.');
    }

    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1 LIMIT 1',
      [email],
    );
    if (existingUser.rowCount) {
      throw new Error('Esse e-mail já pertence a uma conta.');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const id = randomUUID();
    await client.query(
      'INSERT INTO users (id, name, phone, email, password, role) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, name, phone, email, passwordHash, 'admin'],
    );
    await client.query('COMMIT');

    console.log(`Administrador inicial criado: ${email} (${id}).`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

bootstrapAdmin().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : 'Falha ao criar administrador.',
  );
  process.exitCode = 1;
});
