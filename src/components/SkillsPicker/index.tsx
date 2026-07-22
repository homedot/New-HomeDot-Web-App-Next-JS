"use client";

import { useEffect, useState } from "react";
import { colors } from "@/constants/colors";
import { fontSize, radius } from "@/utils/size";
import Icon from "@/components/Icon";
import SwitchProfessionalService, { type ProfessionalSkillRecord } from "@/services/SwitchProfessionalService";

/** Search box + removable selected pills + suggestion pills, with a
 * debounced live search once both category and sub-category are known —
 * extracted from BecomeProfessionalModal so ProfessionalProfileScreen's
 * "Manage skills" flow can reuse the exact same picker for an existing
 * professional instead of duplicating the search/suggestion logic. */
export default function SkillsPicker({
  categoryId,
  subCategoryId,
  selected,
  onChange,
}: {
  categoryId: string;
  subCategoryId: string;
  selected: ProfessionalSkillRecord[];
  onChange: (skills: ProfessionalSkillRecord[]) => void;
}) {
  const [skillQuery, setSkillQuery] = useState("");
  const [skillResults, setSkillResults] = useState<ProfessionalSkillRecord[]>([]);
  const [skillSuggestions, setSkillSuggestions] = useState<ProfessionalSkillRecord[]>([]);
  const [searchingSkills, setSearchingSkills] = useState(false);

  useEffect(() => {
    // The picker's own search/results are scoped to a single category+sub-
    // category pairing — when the caller changes that pairing (e.g. a new
    // professional loaded, or BecomeProfessionalModal's own category select)
    // stale text/results from the old scope must not linger.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting this component's local search UI when its scope props change, not syncing external state
    setSkillQuery("");
    setSkillResults([]);
    if (!categoryId || !subCategoryId) {
      setSkillSuggestions([]);
      return;
    }
    SwitchProfessionalService.getSkillSuggestions(categoryId, subCategoryId).then((res) => {
      if (res.success && res.data?.status) setSkillSuggestions(res.data.data.slice(0, 10));
    });
  }, [categoryId, subCategoryId]);

  // Live search, debounced.
  useEffect(() => {
    if (!categoryId || !subCategoryId || !skillQuery.trim()) return;
    const id = setTimeout(() => {
      setSearchingSkills(true);
      SwitchProfessionalService.searchSkills(categoryId, subCategoryId, skillQuery.trim()).then((res) => {
        setSearchingSkills(false);
        if (res.success && res.data?.status) setSkillResults(res.data.data);
      });
    }, 400);
    return () => clearTimeout(id);
  }, [skillQuery, categoryId, subCategoryId]);

  const toggleSkill = (skill: ProfessionalSkillRecord) => {
    onChange(
      selected.some((s) => s.levelThreeId === skill.levelThreeId)
        ? selected.filter((s) => s.levelThreeId !== skill.levelThreeId)
        : [...selected, skill],
    );
  };

  const skillsEnabled = !!categoryId && !!subCategoryId;
  const availableSkills = skillQuery.trim() ? skillResults : skillSuggestions;

  if (!skillsEnabled) {
    return <p style={{ fontSize: fontSize.xs, color: colors.muted, margin: 0 }}>Choose a category and sub category first.</p>;
  }

  return (
    <>
      <div style={{ ...inputWrap, marginBottom: 10 }}>
        <Icon name="search" size={15} color={colors.muted} />
        <input value={skillQuery} onChange={(e) => setSkillQuery(e.target.value)} placeholder="Search skills…" style={fieldInputStyle} />
      </div>
      {selected.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
          {selected.map((s) => (
            <button
              key={s.levelThreeId}
              onClick={() => toggleSkill(s)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 12px",
                borderRadius: radius.full,
                background: colors.primary,
                color: colors.white,
                fontSize: fontSize.xs,
                fontWeight: 600,
              }}
            >
              {s.levelThreeName}
              <Icon name="close" size={11} color="#fff" />
            </button>
          ))}
        </div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {searchingSkills && <span style={{ fontSize: fontSize.xs, color: colors.muted }}>Searching…</span>}
        {availableSkills
          .filter((s) => !selected.some((sel) => sel.levelThreeId === s.levelThreeId))
          .map((s) => (
            <button
              key={s.levelThreeId}
              onClick={() => toggleSkill(s)}
              style={{
                padding: "7px 12px",
                borderRadius: radius.full,
                border: `1.5px solid ${colors.line}`,
                background: colors.bg,
                color: colors.ink2,
                fontSize: fontSize.xs,
                fontWeight: 600,
              }}
            >
              + {s.levelThreeName}
            </button>
          ))}
      </div>
    </>
  );
}

const inputWrap = {
  display: "flex" as const,
  alignItems: "center" as const,
  gap: 10,
  height: 46,
  border: `1.5px solid ${colors.line}`,
  borderRadius: radius.md,
  padding: "0 14px",
  background: colors.bg,
};

const fieldInputStyle = {
  border: "none",
  outline: "none",
  background: "none",
  width: "100%",
  fontSize: fontSize.sm,
  color: colors.ink,
};
