"use client";

import { useMemo, useState } from "react";

type StudentOption = {
  id: string;
  name: string;
  email?: string;
};

type BulkStudentSelectorProps = {
  students: StudentOption[];
};

export function BulkStudentSelector({ students }: BulkStudentSelectorProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [showOnlySelected, setShowOnlySelected] = useState(false);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const normalizedQuery = query.trim().toLowerCase();

  const visibleStudents = useMemo(
    () =>
      students.filter((student) => {
        if (showOnlySelected && !selectedSet.has(student.id)) {
          return false;
        }

        if (!normalizedQuery) {
          return true;
        }

        const haystack = `${student.name} ${student.email ?? ""}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      }),
    [normalizedQuery, selectedSet, showOnlySelected, students],
  );

  const selectedNames = useMemo(
    () => students.filter((student) => selectedSet.has(student.id)).map((student) => student.name),
    [selectedSet, students],
  );

  const selectedPreview = useMemo(() => {
    if (selectedNames.length === 0) {
      return "No students selected yet.";
    }

    const preview = selectedNames.slice(0, 5).join(", ");
    const remaining = selectedNames.length - 5;
    return remaining > 0 ? `${preview}, +${remaining} more` : preview;
  }, [selectedNames]);

  const toggleStudent = (studentId: string) => {
    setSelectedIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId],
    );
  };

  const selectAll = () => {
    setSelectedIds((prev) => {
      const merged = new Set(prev);
      visibleStudents.forEach((student) => merged.add(student.id));
      return Array.from(merged);
    });
  };

  const clearAll = () => {
    setSelectedIds((prev) => prev.filter((id) => !visibleStudents.some((student) => student.id === id)));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          {selectedIds.length} of {students.length} selected
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Select all
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Clear all
          </button>
        </div>
      </div>

      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search students by name or email"
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
      />

      <label className="inline-flex items-center gap-2 text-xs text-slate-600">
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={showOnlySelected}
          onChange={(event) => setShowOnlySelected(event.target.checked)}
        />
        Show only selected students
      </label>

      <p className="text-xs text-slate-500">Selected preview: {selectedPreview}</p>

      <div className="max-h-52 overflow-y-auto rounded-lg border border-slate-200 p-3">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {visibleStudents.map((student) => (
            <label key={student.id} className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="studentIds"
                value={student.id}
                className="h-4 w-4"
                checked={selectedSet.has(student.id)}
                onChange={() => toggleStudent(student.id)}
              />
              <span>{student.name}</span>
            </label>
          ))}
        </div>
        {visibleStudents.length === 0 ? (
          <p className="text-xs text-slate-500">No students match your current filters.</p>
        ) : null}
      </div>
    </div>
  );
}
