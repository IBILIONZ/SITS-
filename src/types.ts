export type UserRole = 'admin' | 'lecturer' | 'student';

export interface User {
  uid: string;
  email: string;
  role: UserRole;
  displayName: string;
}

export interface Department {
  id: string;
  name: string;
}

export interface AcademicSession {
  id: string;
  name: string;
  current: boolean;
}

export interface Student {
  id: string;
  userId: string;
  email: string;
  matricNo: string;
  firstName: string;
  lastName: string;
  gender: 'Male' | 'Female';
  deptId: string;
  level: string;
  admissionYear: string;
  status: 'Active' | 'Inactive';
}

export interface Course {
  id: string;
  code: string;
  title: string;
  units: number;
  deptId: string;
  level: string;
  lecturerId: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  sessionId: string;
}

export interface Attendance {
  id: string;
  courseId: string;
  studentId: string;
  date: string;
  status: 'Present' | 'Absent' | 'Excused';
}

export interface Result {
  id: string;
  studentId: string;
  courseId: string;
  sessionId: string;
  caScore: number;
  examScore: number;
  totalScore: number;
  grade: string;
  point: number;
}
