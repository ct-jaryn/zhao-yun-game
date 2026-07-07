import { SKILLS } from '../../config/index.js';

/**
 * 战斗计算系统：统一处理技能伤害、暴击、吸血等战斗数值。
 * 与渲染、输入、场景生命周期解耦，便于单元测试。
 */
export class CombatSystem {
  calculateSkillHit(player, enemy, skillIdx) {
    const sk = SKILLS[skillIdx];
    const branchEffects = player.getSkillBranchEffects(skillIdx);
    const passiveMult = player.getDamageMult(enemy);
    const skillLevelMult = player.skillDamageMult[skillIdx] || 1;
    const branchDamageMult = branchEffects.damageMult || 1;
    const critBonus = branchEffects.critBonus || 0;

    let damage = Math.floor(player.atk * sk.dmgMult * branchDamageMult * skillLevelMult * passiveMult);
    const isCrit = Math.random() * 100 < (player.crit + critBonus);
    if (isCrit) damage = Math.floor(damage * 1.8);

    const lifesteal = branchEffects.lifesteal || 0;
    const lifestealHeal = (lifesteal > 0 && damage > 0)
      ? Math.floor(damage * lifesteal / 100)
      : 0;

    return { damage, isCrit, lifestealHeal };
  }
}
