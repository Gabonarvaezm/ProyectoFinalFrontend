import { ACADEMIC_MODE } from './app/core/services/academic-mode';

// Existing unit fixtures exercise the explicit local repository without live network access.
// Supabase integration specs override this token with their own test doubles.
export default [{ provide: ACADEMIC_MODE, useValue: 'local' }];
