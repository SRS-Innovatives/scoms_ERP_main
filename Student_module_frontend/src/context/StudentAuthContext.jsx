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

  const login = (admissionNo, password) => {
    const loggedStudent = {
      id: "STD-2026-001",
      admissionNo,
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
    };
    setStudent(loggedStudent);
    localStorage.setItem('scoms_student_user', JSON.stringify(loggedStudent));
  };

  const logout = () => {
    setStudent(null);
    localStorage.removeItem('scoms_student_user');
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
