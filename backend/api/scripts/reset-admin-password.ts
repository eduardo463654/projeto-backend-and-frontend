import 'dotenv/config';
import bcrypt from 'bcrypt';
import { Pool } from 'pg';

async function resetAdminPassword() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const connectionString = process.env.DATABASE_URL;

  if (!email || !password || !connectionString) {
    throw new Error(
      'Configure ADMIN_EMAIL, ADMIN_PASSWORD e DATABASE_URL no ambiente.',
    );
  }

  if (password.length < 12) {
    throw new Error('ADMIN_PASSWORD precisa ter pelo menos 12 caracteres.');
  }

  const pool = new Pool({ connectionString });
  const client = await pool.connect();
  let transactionStarted = false;

  try {
    await client.query('BEGIN');
    transactionStarted = true;

    const result = await client.query<{ id: string }>(
      "SELECT id FROM users WHERE lower(email) = lower($1) AND role = 'admin' FOR UPDATE",
      [email],
    );

    if (result.rowCount !== 1) {
      throw new Error(
        'A conta configurada não existe ou não possui papel de administrador.',
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await client.query('UPDATE users SET password = $1 WHERE id = $2', [
      passwordHash,
      result.rows[0].id,
    ]);
    await client.query('COMMIT');
    transactionStarted = false;

    console.log('Senha da conta administradora atualizada.');
  } catch (error) {
    if (transactionStarted) await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

resetAdminPassword().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : 'Falha ao redefinir a senha.',
  );
  process.exitCode = 1;
});
