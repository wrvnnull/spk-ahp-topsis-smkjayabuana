export class MeResponseDto {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'GURU' | 'KEPALA_SEKOLAH';
  owned_class_ids?: string[];
}
