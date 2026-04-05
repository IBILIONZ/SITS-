import { collection, getDocs, addDoc, setDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export const seedDatabase = async () => {
  const deptsSnap = await getDocs(collection(db, 'departments'));
  if (deptsSnap.empty) {
    console.log('Seeding database...');
    
    // Departments
    const depts = [
      { name: 'Computer Science' },
      { name: 'Business Administration' },
      { name: 'Electrical Engineering' },
      { name: 'Civil Engineering' },
    ];
    
    const deptIds: string[] = [];
    for (const dept of depts) {
      const docRef = await addDoc(collection(db, 'departments'), dept);
      deptIds.push(docRef.id);
    }

    // Sessions
    const sessions = [
      { name: '2024/2025 First Semester', current: true },
      { name: '2024/2025 Second Semester', current: false },
    ];
    for (const session of sessions) {
      await addDoc(collection(db, 'academic_sessions'), session);
    }

    // Seed a student record for the current user to test transcript
    await addDoc(collection(db, 'students'), {
      firstName: 'Isaiah',
      lastName: 'Caleb',
      email: 'isaiahcaleb91@gmail.com',
      matricNo: 'ESAE/CS/2024/001',
      gender: 'Male',
      deptId: deptIds[0],
      level: '100L',
      admissionYear: '2024',
      status: 'Active',
      userId: '' // Will be linked on login or by email fallback
    });

    // Seed some lecturers
    const lecturers = [
      { displayName: 'Dr. Smith', email: 'smith@esae.edu', role: 'lecturer' },
      { displayName: 'Prof. Johnson', email: 'johnson@esae.edu', role: 'lecturer' },
    ];
    for (const lecturer of lecturers) {
      const uid = 'lecturer-' + Math.random().toString(36).substr(2, 9);
      const lecturerData = { ...lecturer, uid };
      await setDoc(doc(db, 'users', uid), lecturerData);
      
      // Seed a course for each lecturer
      await addDoc(collection(db, 'courses'), {
        code: lecturer.displayName === 'Dr. Smith' ? 'CSC 101' : 'BUS 101',
        title: lecturer.displayName === 'Dr. Smith' ? 'Introduction to Programming' : 'Principles of Management',
        units: 3,
        deptId: lecturer.displayName === 'Dr. Smith' ? deptIds[0] : deptIds[1],
        level: '100L',
        lecturerId: uid
      });
    }

    console.log('Database seeded successfully!');
  }
};
