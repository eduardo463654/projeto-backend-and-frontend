import { validate } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

describe('CreateUserDto RA validation', () => {
  const raRequiredRoles = ['aluno', 'professor', 'monitor'];

  it.each(raRequiredRoles)('requires RA for %s', async (role) => {
    const dto = Object.assign(new CreateUserDto(), { role });
    const errors = await validate(dto);

    expect(errors.find((error) => error.property === 'ra')).toBeDefined();
  });

  it.each(raRequiredRoles)('accepts a valid RA for %s', async (role) => {
    const dto = Object.assign(new CreateUserDto(), {
      role,
      ra: '123456',
    });
    const errors = await validate(dto);

    expect(errors.find((error) => error.property === 'ra')).toBeUndefined();
  });

  it('keeps RA optional for other roles', async () => {
    const dto = Object.assign(new CreateUserDto(), { role: 'funcionario' });
    const errors = await validate(dto);

    expect(errors.find((error) => error.property === 'ra')).toBeUndefined();
  });
});
