import type { AssignmentDetail } from '@/lib/services/assignment-detail-queries';
import { assignmentStatusLabel } from '@/lib/services/assignments-queries';
import type { AssignmentStatus } from '@/schemas/AssignmentSchema';
import { AssignmentStatusActions } from '../status/AssignmentStatusActions';
import { ChecklistView } from '../checklist/ChecklistView';
import { ChordDrillView } from '../chord-drill/ChordDrillView';

type Props = {
  assignment: AssignmentDetail;
  canManage: boolean; // teacher/admin
  canAct: boolean; // owning student or manager — may change status
  effectiveStatus: AssignmentStatus;
};

const eyebrowStyle: React.CSSProperties = {
  fontFamily: 'var(--mono)',
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '.14em',
  color: 'var(--gold-2)',
  marginBottom: 8,
};

/**
 * The "do the work → hand it in" body of the detail Progress card: chord-drill
 * and checklist tick-offs feed a clearly-framed status action. For an owning
 * student this reads as the submit path; a teacher/admin sees a neutral
 * "update status" framing. Media upload + practice-log chart are a later wave.
 */
export const AssignmentSubmitPanel = ({
  assignment,
  canManage,
  canAct,
  effectiveStatus,
}: Props) => {
  const isStudentSubmitter = canAct && !canManage;
  const hasWorkItems = Boolean(assignment.chordDrill) || assignment.checklist.length > 0;

  return (
    <>
      {assignment.chordDrill && (
        <div style={{ marginBottom: 18 }}>
          <ChordDrillView
            assignmentId={assignment.id}
            drill={assignment.chordDrill}
            result={assignment.chordDrillResult}
            canAct={canAct}
          />
        </div>
      )}
      {assignment.checklist.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <ChecklistView
            assignmentId={assignment.id}
            items={assignment.checklist}
            canToggle={canAct}
          />
        </div>
      )}

      {canAct ? (
        <div
          style={{
            borderTop: hasWorkItems ? '1px solid var(--rule)' : 'none',
            paddingTop: hasWorkItems ? 16 : 0,
          }}
        >
          <div style={eyebrowStyle}>{isStudentSubmitter ? 'Hand it in' : 'Update status'}</div>
          {isStudentSubmitter && (
            <p
              style={{
                margin: '0 0 12px',
                fontSize: 13,
                lineHeight: 1.55,
                color: 'var(--ink-3)',
              }}
            >
              Tick off what you&apos;ve practised, then mark it complete to send it to your teacher.
            </p>
          )}
          <AssignmentStatusActions
            assignmentId={assignment.id}
            currentStatus={assignment.status as AssignmentStatus}
            canManage={canManage}
          />
        </div>
      ) : (
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-4)' }}>
          Status: {assignmentStatusLabel(effectiveStatus)}
        </div>
      )}
    </>
  );
};
