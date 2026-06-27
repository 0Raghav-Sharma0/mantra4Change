import type { SchoolRecord } from "./filters.js";

export interface ScopedSchoolMetrics {
  enrollment: number;
  attendance: number;
  attendanceRate: number;
}

function gradeMetrics(
  record: SchoolRecord,
  grade: "6" | "7" | "8",
  subject?: string,
): ScopedSchoolMetrics {
  const enrollmentKey = `enrollmentClass${grade}` as keyof SchoolRecord;
  const scienceKey = `attendanceClass${grade}Science` as keyof SchoolRecord;
  const mathKey = `attendanceClass${grade}Math` as keyof SchoolRecord;

  const enrollment = Number(record[enrollmentKey]);
  let attendance = 0;

  const subjectNorm = subject?.toLowerCase();
  if (!subjectNorm || subjectNorm === "science") {
    attendance += Number(record[scienceKey]);
  }
  if (!subjectNorm || subjectNorm === "math") {
    attendance += Number(record[mathKey]);
  }
  if (subjectNorm === "math and science") {
    attendance = Number(record[scienceKey]) + Number(record[mathKey]);
  }

  const attendanceRate = enrollment > 0 ? attendance / enrollment : 0;
  return { enrollment, attendance, attendanceRate: Math.min(attendanceRate, 1) };
}

export function computeScopedSchoolMetrics(
  record: SchoolRecord,
  grade?: string,
  subject?: string,
): ScopedSchoolMetrics {
  if (!grade && !subject) {
    return {
      enrollment: record.totalEnrollment,
      attendance: record.totalAttendance,
      attendanceRate: record.attendanceRate,
    };
  }

  if (grade && ["6", "7", "8"].includes(grade)) {
    return gradeMetrics(record, grade as "6" | "7" | "8", subject);
  }

  if (subject) {
    let enrollment = 0;
    let attendance = 0;
    for (const g of ["6", "7", "8"] as const) {
      const pattern = new RegExp(`\\bClass(?:es)?\\s+${g}\\b`, "i");
      if (!pattern.test(record.classes)) continue;
      const scoped = gradeMetrics(record, g, subject);
      enrollment += scoped.enrollment;
      attendance += scoped.attendance;
    }
    return {
      enrollment,
      attendance,
      attendanceRate: enrollment > 0 ? Math.min(attendance / enrollment, 1) : 0,
    };
  }

  return {
    enrollment: record.totalEnrollment,
    attendance: record.totalAttendance,
    attendanceRate: record.attendanceRate,
  };
}

export function aggregateParticipation(records: SchoolRecord[]): {
  totalSchools: number;
  participatingSchools: number;
  participationRate: number;
} {
  const totalSchools = records.length;
  const participatingSchools = records.filter((r) => r.pblConducted).length;
  return {
    totalSchools,
    participatingSchools,
    participationRate: totalSchools > 0 ? participatingSchools / totalSchools : 0,
  };
}

export function aggregateEvidence(records: SchoolRecord[]): {
  evidenceSchools: number;
  evidenceSubmissionRate: number;
} {
  const totalSchools = records.length;
  const evidenceSchools = records.filter((r) => r.evidenceSubmitted).length;
  return {
    evidenceSchools,
    evidenceSubmissionRate: totalSchools > 0 ? evidenceSchools / totalSchools : 0,
  };
}

export function aggregateAttendance(
  records: SchoolRecord[],
  grade?: string,
  subject?: string,
): {
  totalEnrollment: number;
  totalAttendance: number;
  attendanceRate: number;
} {
  let totalEnrollment = 0;
  let totalAttendance = 0;
  let weightedRateSum = 0;
  let rateWeight = 0;

  for (const record of records) {
    const scoped = computeScopedSchoolMetrics(record, grade, subject);
    totalEnrollment += scoped.enrollment;
    totalAttendance += scoped.attendance;
    if (scoped.enrollment > 0) {
      weightedRateSum += scoped.attendanceRate * scoped.enrollment;
      rateWeight += scoped.enrollment;
    }
  }

  const attendanceRate = rateWeight > 0 ? weightedRateSum / rateWeight : 0;
  return { totalEnrollment, totalAttendance, attendanceRate };
}
