/** Arabic-friendly initials for profile avatars. */
export function profileInitials(fullName: string): string {
  const parts = fullName
    .replace(/د\.?/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return 'ر';
  if (parts.length === 1) return parts[0][0] ?? 'ر';
  return `${parts[0][0]}${parts[parts.length - 1][0]}`;
}

export function displayNameForUser(user: {
  role: string;
  doctorProfile?: { fullName: string } | null;
  patientProfile?: { fullName: string } | null;
  adminProfile?: { fullName: string } | null;
  email: string;
}): string {
  return (
    user.doctorProfile?.fullName ||
    user.patientProfile?.fullName ||
    user.adminProfile?.fullName ||
    user.email
  );
}
