import React from "react";

function AttendanceTable({ students }) {
  return (
    <table className="attendance-table">
      <thead>
        <tr>
          <th>ФИО</th>
          <th>ID пропуска</th>
          <th>Последняя дата</th>
          <th>Калитка</th>
          <th>Турникет</th>
          <th>Кабинет</th>
          <th>Номер кабинета</th>
        </tr>
      </thead>
      <tbody>
        {students.map((student) => (
          <tr key={student.id}>
            <td>{student.fio}</td>
            <td>{student.pass_id}</td>
            <td>{student.last_pass_date}</td>
            <td>{student.gate_pass ? "✅" : "❌"}</td>
            <td>{student.turnstile_pass ? "✅" : "❌"}</td>
            <td>{student.cabinet_pass ? "✅" : "❌"}</td>
            <td>{student.cabinet_number}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default AttendanceTable;