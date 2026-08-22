import React, { createContext, useContext, useState } from 'react';

const StudentAuthContext = createContext();

export const StudentAuthProvider = ({ children }) => {
  const [student, setStudent] = useState(() => {
    const saved = localStorage.getItem('scoms_student_user');
    if (saved) return JSON.parse(saved);
    return {
      id: "STD-2026-001",
      admissionNo: "SCOMS2026CS001",
      regNo: "2026CS4012",
      name: "Arun Kumar",
      email: "arun.cs2026@srilakshmicollege.ac.in",
      phone: "+91 98765 12345",
      photo: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400",
      institution: "Sri Lakshmi Arts and Science College",
      department: "Computer Science",
      course: "B.Sc Computer Science",
      batch: "2024 - 2027",
      semester: "Semester 4",
      section: "A",
      rollNo: "401",
      classTeacher: "Dr. Malathi S. (HOD CS)",
      status: "Active",
      dob: "2005-04-14",
      gender: "Male",
      bloodGroup: "O+ positive",
      address: "42, South Car Street, Palayamkottai",
      city: "Tirunelveli",
      district: "Tirunelveli",
      state: "Tamil Nadu",
      pincode: "627002",
      fatherName: "Mr. S. Kumar",
      motherName: "Mrs. K. Lakshmi",
      parentPhone: "+91 94431 88990",
      gpa: "8.92",
      attendancePercentage: 88.5
    };
  });

  const login = (userData, token) => {
    const loggedStudent = typeof userData === 'string'
      ? {
          id: "STD-2026-001",
          admissionNo: userData,
          regNo: "2026CS4012",
          name: "Arun Kumar",
          email: "arun.cs2026@srilakshmicollege.ac.in",
          phone: "+91 98765 12345",
          photo: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400",
          institution: "Sri Lakshmi Arts and Science College",
          department: "Computer Science",
          course: "B.Sc Computer Science",
          batch: "2024 - 2027",
          semester: "Semester 4",
          section: "A",
          rollNo: "401",
          classTeacher: "Dr. Malathi S.",
          status: "Active",
          gpa: "8.92",
          attendancePercentage: 88.5
        }
      : {
          id: userData.student?.id || "STD-2026-001",
          admissionNo: userData.admissionNumber || userData.student?.admissionNumber || "SCOMS2026CS001",
          regNo: userData.student?.rollNumber || "2026CS4012",
          name: userData.student ? `${userData.student.firstName} ${userData.student.lastName}` : (userData.name || "Arun Kumar"),
          email: userData.email || "arun.cs2026@srilakshmicollege.ac.in",
          phone: userData.mobile || "+91 98765 12345",
          photo: userData.avatar || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400",
          institution: userData.institutionName || "Sri Lakshmi Arts and Science College",
          department: userData.student?.department?.name || "Computer Science",
          course: userData.student?.course?.name || "B.Sc Computer Science",
          batch: "2024 - 2027",
          semester: userData.student?.section?.semester?.name || "Semester 4",
          section: userData.student?.section?.name || "A",
          rollNo: userData.student?.rollNumber || "401",
          classTeacher: "Dr. Malathi S.",
          status: userData.status || "Active",
          gpa: "8.92",
          attendancePercentage: 88.5
        };

    setStudent(loggedStudent);
    localStorage.setItem('scoms_student_user', JSON.stringify(loggedStudent));
    if (token) {
      localStorage.setItem('scoms_student_token', token);
    }
  };

  const logout = () => {
    setStudent(null);
    localStorage.removeItem('scoms_student_user');
    localStorage.removeItem('scoms_student_token');
  };

  return (
    <StudentAuthContext.Provider value={{ student, setStudent, login, logout }}>
      {children}
    </StudentAuthContext.Provider>
  );
};

export const useStudentAuth = () => {
  const context = useContext(StudentAuthContext);
  if (!context) throw new Error('useStudentAuth must be used within StudentAuthProvider');
  return context;
};
