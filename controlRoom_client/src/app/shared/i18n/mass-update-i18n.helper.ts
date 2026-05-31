import { MenuItem } from 'primeng/api';
import { LabelService } from '../services/labels/labels.service';

/** Shared p-steps labels for mass-change wizards (all mass.update/* screens). */
export function buildMassUpdateMenuItems(
  labels: LabelService,
  step0Title?: string,
): MenuItem[] {
  const t = (key: string, fb: string) => labels.text(key, fb);
  const s0 = step0Title ?? t('MU.STP0.TTL', 'Pick your data file');
  return [
    {
      id: 'step0',
      label: t('MU.STP0.LBL', 'Data selection'),
      title: s0,
      command: () => {},
    },
    {
      id: 'step1',
      label: t('MU.STP1.LBL', 'Configuration'),
      title: t('MU.STP1.TTL', 'Define changes parameter'),
      command: () => {},
    },
    {
      id: 'step2',
      label: t('MU.STP2.LBL', 'Execution/Schedule'),
      title: t('MU.STP2.TTL', 'Execute now or schedule the change'),
      command: () => {},
    },
    {
      id: 'step3',
      label: t('MU.STP3.LBL', 'Confirmation'),
      title: t('MU.STP3.TTL', 'Confirmation for execution/planification'),
      command: () => {},
    },
  ];
}
