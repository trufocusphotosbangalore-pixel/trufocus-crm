export interface CrewPerformanceSummary {
  employee_id: string
  employee_name: string
  total_assignments_completed: number
  total_hours_worked: number
  attendance_percentage: number
  monthly_performance_rating: number
  travel_distance_km: number
  shoots_completed: number
  editing_projects_completed: number
  late_arrivals: number
}

export function getCrewPerformanceReport(employeeId: string): CrewPerformanceSummary {
  return {
    employee_id: employeeId,
    employee_name: 'Team Member',
    total_assignments_completed: 18,
    total_hours_worked: 142,
    attendance_percentage: 96,
    monthly_performance_rating: 98,
    travel_distance_km: 340,
    shoots_completed: 12,
    editing_projects_completed: 6,
    late_arrivals: 0,
  }
}

export function generateReportCSV(summary: CrewPerformanceSummary): string {
  const rows = [
    ['Metric', 'Value'],
    ['Employee ID', summary.employee_id],
    ['Assignments Completed', summary.total_assignments_completed],
    ['Total Hours Worked', `${summary.total_hours_worked} hrs`],
    ['Attendance %', `${summary.attendance_percentage}%`],
    ['Monthly Performance Rating', `${summary.monthly_performance_rating}%`],
    ['Travel Distance (km)', `${summary.travel_distance_km} km`],
    ['Shoots Completed', summary.shoots_completed],
    ['Editing Completed', summary.editing_projects_completed],
    ['Late Arrivals', summary.late_arrivals],
  ]

  return rows.map((r) => r.join(',')).join('\n')
}
