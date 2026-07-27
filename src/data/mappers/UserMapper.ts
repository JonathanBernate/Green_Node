import type { UserResponse } from '@/data/datasources/remote/api/authApi';
import type { User } from '@/domain/entities/User';

export function mapApiUserToEntity(data: UserResponse): User {
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    points: data.points ?? 0,
    level: data.level ?? 1,
  };
}
