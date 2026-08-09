export interface PersonalInformation {
  fullName: string;
  email: string; // read-only
  internId: string; // read-only
  mobile: string;
  dateOfBirth: string;
  gender: string;
  city: string;
  linkedInUrl: string;
  githubUrl: string;
}

export interface InternshipInfoReadOnly {
  problemStatement: string;
  assignedAdmin: string;
  status: string;
  internshipStartDate: string;
  internshipEndDate: string;
  currentWeek: number;
  duration: string;
  batch: string;
  workMode: string;
  assignedLocation: string;
}

export interface ProfileData {
  id: string;
  profilePhotoUrl?: string;
  completionPercentage: number;
  personal: PersonalInformation;
  internship: InternshipInfoReadOnly;
}
