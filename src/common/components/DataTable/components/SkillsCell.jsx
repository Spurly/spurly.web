import { Badge } from 'src/common/components/Badge';

export function SkillsCell({ value = [] }) {
  const skills = Array.isArray(value) ? value : [];

  if (skills.length === 0) {
    return <span style={{ color: 'var(--text-tertiary)' }}>—</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {skills.slice(0, 3).map((skill, idx) => (
        <Badge key={skill?._id ?? idx} variant="default">
          {typeof skill === 'string' ? skill : skill?.name}
        </Badge>
      ))}
      {skills.length > 3 && (
        <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>+{skills.length - 3}</span>
      )}
    </div>
  );
}
