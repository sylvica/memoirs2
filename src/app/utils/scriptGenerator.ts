import type {
  DirectorScriptPayload,
  MemoirData, BasicInfo, LifeStage,
  LifeFivePartAnswers,
} from '../context/MemoirContext';

// ====================================================
// 统一风格：温暖、纪实、真诚
// 新版：优先使用 lifeFiveAnswers；否则沿用旧版 lifeStages
// ====================================================

function pronoun(gender: string): string {
  if (gender === '女') return '她';
  if (gender === '男') return '他';
  return '他/她';
}

function buildOpening(info: BasicInfo): string {
  const name = info.name || '主人公';
  const p = pronoun(info.gender);
  const lines: string[] = [];

  if (info.birthYear && info.birthPlace) {
    lines.push(`${info.birthYear}年，${info.birthPlace}，一个新的生命来到了这个世界——${p}就是${name}。`);
  } else if (info.birthYear) {
    lines.push(`${info.birthYear}年，${name}来到了这个世界。`);
  } else if (info.birthPlace) {
    lines.push(`${info.birthPlace}，是${name}出生的地方。`);
  } else {
    lines.push(`这是${name}的人生故事。`);
  }

  if (info.growUpPlace) {
    lines.push(
      `在${info.growUpPlace}，${p}度过了最初的岁月，在那片土地上一点一点地长大成人。`,
    );
  }

  if (info.identityTags && info.identityTags.length > 0) {
    const tagStr = info.identityTags.slice(0, 3).join('、');
    lines.push(
      `作为一名${tagStr}，${name}用${p}自己的方式，走过了属于自己的这段人生旅程。`,
    );
  } else {
    lines.push(`${p}用${p}自己的方式，走过了这段属于自己的人生旅程。`);
  }

  return lines.join('\n');
}

const STAGE_INTROS: Record<string, (name: string, p: string) => string> = {
  impression:   (name)     => `认识${name}的人，都说${name}身上有种特别的气质。${name}这样描述自己——`,
  childhood:    (_n, p)    => `说起童年，${p}的记忆里有这样一些画面——`,
  primary:      (_n, p)    => `少年时代，在那个懵懵懂懂又充满好奇的岁月里，${p}留下了这样的印记——`,
  youth:        (_n, p)    => `青春，是每个人心里最深的一页。${p}的青春，是这样的——`,
  society:      (_n, p)    => `离开校园，踏入社会，对谁来说都是一道门槛。那段时日，${p}是这样走过来的——`,
  career:       (name, p)  => `工作与事业，是${name}人生中分量很重的一章。${p}这样回顾那段岁月——`,
  marriage:     (_n, p)    => `婚姻与家庭，给${p}的人生带来了新的温度。${p}这样说起那些年——`,
  children:     (_n, p)    => `有了孩子，有了更重的担子，也有了更深的牵挂。${p}这样记得那段日子——`,
  turning:      (_n, p)    => `人生不会总是一帆风顺。那些艰难的时刻，${p}是这样经历的——`,
  achievement:  (name, p)  => `${name}的人生里，有些时刻值得被特别记住。${p}这样回顾那些高光时刻——`,
  recent:       (_n, p)    => `说起近些年的生活，${p}觉得——`,
  message:      (name)     => `最后，${name}有些话，想对家人说——`,
};

function buildStageNarration(stage: LifeStage, info: BasicInfo): string {
  const name = info.name || '主人公';
  const p = pronoun(info.gender);
  const intro = STAGE_INTROS[stage.id]
    ? STAGE_INTROS[stage.id](name, p)
    : `关于${stage.title}，${name}是这样说的——`;
  const content = stage.content.trim();
  return `${intro}\n\n${content}`;
}

function buildClosing(info: BasicInfo, filledStages: LifeStage[], hasFinalMessage: boolean): string {
  const name = info.name || '主人公';
  const p = pronoun(info.gender);

  if (hasFinalMessage) {
    return (
      `这就是${name}的故事。\n\n` +
      `平凡里有岁月，简单里有一生。` +
      `${p}走过的每一步，都真实，都值得被温柔地留存下来。`
    );
  }

  const yearPart = info.birthYear ? `从${info.birthYear}年走到今天，` : '';
  return (
    `${yearPart}${name}用${p}自己的方式，走完了这段人生。\n\n` +
    `没有惊天动地，却有属于${p}自己的厚重与温度。\n` +
    `这段岁月，值得被永远珍藏。`
  );
}

function hasLifeFiveContent(a: LifeFivePartAnswers): boolean {
  return Object.values(a).some(v => typeof v === 'string' && v.trim() !== '');
}

/** 去掉末尾的句号/句点，避免与模板再补的「。」叠成双句号 */
function stripTrailingPeriods(s: string): string {
  return s.trim().replace(/[。．.]+$/u, '').trim();
}

/** 嵌入模板前的用户片段：去尾句号；空则回退默认文案 */
function embed(
  raw: string | undefined,
  fallback: string,
): string {
  const t = raw?.trim();
  if (!t) return fallback;
  const cleaned = stripTrailingPeriods(t);
  return cleaned || fallback;
}

/** 选填长文：有内容则去尾句号后再包一层，避免「……。。」 */
function embedOptional(raw: string | undefined, prefix: string): string {
  const t = raw?.trim();
  if (!t) return '';
  const cleaned = stripTrailingPeriods(t);
  if (!cleaned) return '';
  return `${prefix}${cleaned}。`;
}

/** 成稿后兜底：合并连续中文句号 */
function collapseDuplicatePeriods(text: string): string {
  return text.replace(/。{2,}/g, '。');
}

/** 婚恋选填：无则空串；内文去尾句号，避免与外壳叠句 */
function wrapLoveStory(raw: string | undefined): string {
  const t = raw?.trim();
  if (!t) return '';
  const cleaned = stripTrailingPeriods(t);
  if (!cleaned) return '';
  return `缘分这东西很奇妙，关于成家，我一直记得${cleaned}。`;
}

/** 育儿选填：无则空串（各套模板中自行衔接） */
function wrapChildrenStory(raw: string | undefined): string {
  const t = raw?.trim();
  if (!t) return '';
  const cleaned = stripTrailingPeriods(t);
  if (!cleaned) return '';
  return `为人父母后，有了新的软肋和铠甲。${cleaned}，这就足够了。`;
}

/** 身份标签：干净字符串；空则默认「普通人」 */
function buildIdentityTagLabel(info: BasicInfo): string {
  const raw = info.identityTags?.map(t => t.trim()).filter(Boolean).join('、') ?? '';
  return raw || '普通人';
}

interface FullScriptTemplate {
  title: string;
  ch1: string;
  ch2: string;
  ch3: string;
  ch4: string;
}

/**
 * 纯本地第一人称自传：10 套完整四乐章独立剧本；基础信息来自 basicInfo，问卷来自 answers。
 * 仅输出 chapter_name、voice_over（无视觉字段）。
 */
export function generateLocalScript(
  answers: LifeFivePartAnswers,
  basicInfo: BasicInfo,
): DirectorScriptPayload {
  const y = basicInfo.birthYear?.trim();

  const name = basicInfo.name?.trim() || '我';
  const bYear = y ? `${y}年` : '那一年';
  const bPlace = basicInfo.birthPlace?.trim() || '故乡';
  const gPlace = basicInfo.growUpPlace?.trim()
    ? `，后来在${basicInfo.growUpPlace.trim()}扎了根`
    : '';
  const tag = buildIdentityTagLabel(basicInfo);
  const age = basicInfo.ageGroup?.trim() || '如今年岁渐长';

  const qSense = embed(answers.q_childhood_sense, '老屋里那股熟悉的烟火气');
  const qDream = embed(answers.q_early_dream, '赶紧长大，凭自己的双手撑起这个家');
  const exChild = embedOptional(answers.q_extra_childhood, '我还记得，');

  const qItem = embed(answers.q_youth_item, '一件体面的新衣服');
  const qAchieve = embed(
    answers.q_first_achievement,
    '第一次靠自己独立做成了一件事',
  );
  const qLove = wrapLoveStory(answers.q_love_marriage);
  const exYouth = embedOptional(answers.q_extra_youth, '那段青涩的日子里，');

  const qChild = wrapChildrenStory(answers.q_children);
  const qHard = embed(answers.q_hardest_moment, '为了生计四处奔波的那些黑夜');
  const qPeak = embed(answers.q_career_peak, '终于在这个世上站稳了脚跟');
  const exAdult = embedOptional(answers.q_extra_adult, '一路走来，');

  const qLegacy = embed(answers.q_legacy, '踏踏实实做事的规矩');
  const exMiddle = embedOptional(answers.q_extra_middle_age, '静下心来想想，');
  const qMsg = embed(
    answers.q_final_message,
    '人这一辈子，别怕吃苦，但也别忘了看看路边的风景',
  );

  const templates: FullScriptTemplate[] = [
    {
      title: '岁月回响：我的光影回忆录',
      ch1:
        `我叫${name}。${bYear}，我出生在${bPlace}${gPlace}。大半辈子过去，作为一个步入${age}的${tag}，回首几十年的岁月，脑海里最先浮现的总是小时候${qSense}。那时候日子简单，我最大的梦想就是${qDream}。${exChild}`,
      ch2:
        `带着这份质朴，我步入了社会。拿到自己赚的钱，我咬牙置办了${qItem}，那是对未来的一份期盼。记得有一次，我${qAchieve}，那一刻我突然觉得，这双手是能干出点名堂的。${qLove}${exYouth}`,
      ch3:
        `人生步入正轨，责任也更重了。${qChild}成家立业的路哪有一帆风顺。最难熬的时候，是${qHard}。但在风雨里我挺了过来，这辈子最让我骄傲的，是${qPeak}。每次想起这个，心里都觉得没白干。${exAdult}`,
      ch4:
        `如今风雨都经历了，日子也慢了下来。回头看看，我留给后辈的除了成绩，更重要的是${qLegacy}。${exMiddle}如果这部视频留给孩子们，我最想说一句：${qMsg}。按你们自己的节奏去走吧。`,
    },
    {
      title: '大地印记：我的漫漫人生路',
      ch1:
        `每当有人问起我的过往，我总会先报上名字：${name}。时间倒回${bYear}，那时的${bPlace}印下了我人生的第一串脚印${gPlace}。外人看我可能就是个普通的${tag}，但在我这个${age}的人心里，装满了一个时代的记忆。最忘不掉的，还是童年时${qSense}，以及那个想要${qDream}的纯粹愿望。${exChild}`,
      ch2:
        `长大的过程，就是不断与世界交手。初入社会，我买下了人生中第一件贵重物品——${qItem}。当我第一次${qAchieve}时，那种成就感让我知道自己真正入了行。${qLove ? `在这条路上，我也迎来了自己的感情，${qLove}` : ''}${exYouth}`,
      ch3:
        `要想立住脚，就得吃苦。${qChild}为了肩上的责任，我经历过${qHard}。那些咬紧牙关的日夜，成了我生命里最硬的骨头。后来，当我做成了${qPeak}这件大事，我知道一切风雨都值了。${exAdult}`,
      ch4:
        `到了如今这个年纪，回头看像做了一场长梦。我总跟后辈们说，立足靠的是${qLegacy}。${exMiddle}孩子们，记住我的话：${qMsg}。心是热的，路就不会走偏。`,
    },
    {
      title: '时光列车：我的独家记忆',
      ch1:
        `人生像一趟单程列车。我的起点在${bYear}的${bPlace}${gPlace}。我扮演过很多角色，现在最让我踏实的身份是一个${tag}。如今驶入${age}的风景，车窗外光影倒退，我总是想起${qSense}，还有那个${qDream}的梦。${exChild}`,
      ch2:
        `列车轰隆隆向前，我迎来了青年时代。那几年，我用辛勤换来了${qItem}。一路上跌跌撞撞，直到我${qAchieve}，才真正体会到什么叫骄傲。${qLove ? `也正是在这段旅程中，${qLove}` : ''}${exYouth}`,
      ch3:
        `列车也会经过黑暗隧道。${qChild}在人生的中段，我遇到了${qHard}。那是真难啊，但我没想过放弃。熬过黑夜就是光明，我迎来了高光时刻——${qPeak}。这是我给自己打下的江山。${exAdult}`,
      ch4:
        `现在，列车放慢了速度。看尽了沿途风景，我要传承下去的不是金银财宝，而是${qLegacy}。${exMiddle}未来的路要靠子孙们自己走，我唯有一句叮咛：${qMsg}。这趟车我坐得坦荡，希望你们也是。`,
    },
    {
      title: '逆风生长：我的滚烫人生',
      ch1:
        `如果要把我这${age}的人生写成一本书，第一章必须叫“故乡”。我叫${name}，${bYear}生于${bPlace}${gPlace}。这一生，我作为一个${tag}，风风雨雨都蹚过来了。无论走多远，我灵魂的根一直扎在小时候${qSense}的地方。那时候天很高，我心心念念的，就是${qDream}。${exChild}`,
      ch2:
        `为了这个梦，我闯入了成年人的世界。初尝赚钱的滋味，我送给自己${qItem}。带着这股新鲜劲，在${qAchieve}的那一天，我尝到了胜利的果实。${qLove ? `在打拼的岁月里，我的生活也渐渐完整，${qLove}` : ''}${exYouth}`,
      ch3:
        `可真正的考验往往猝不及防。${qChild}记忆里最冰冷的日子，是${qHard}。我逼着自己像钉子一样扎在泥里，绝不认输。正是那段死磕的日子，成就了后来${qPeak}的我。那是血汗浇灌出的花朵。${exAdult}`,
      ch4:
        `岁月不饶人，我也到了交棒的年纪。我留给这个世界的，更重要的是${qLegacy}。${exMiddle}录下这些话，是想告诉后辈们：${qMsg}。别怕跌倒，拍拍土站起来，你们也会有自己的滚烫人生。`,
    },
    {
      title: '平凡世界：我的烟火人间',
      ch1:
        `大家好，我是${name}，一个步入${age}的人。${bYear}我出生在${bPlace}${gPlace}。在这个偌大的世界里，我只是一个平凡的${tag}，用力地过着属于自己的烟火日子。我时常怀念小时候${qSense}，还有那个想要${qDream}的质朴愿望。${exChild}`,
      ch2:
        `就像每个普通人一样，我为了生活奔波。年轻时，拥有了${qItem}就能让我高兴好几天。当我在劳作中${qAchieve}时，那种被认可的快乐填满了心房。${qLove ? `平凡的日子里也有浪漫，${qLove}` : ''}${exYouth}`,
      ch3:
        `普通人的生活里，多的是柴米油盐和突如其来的难关。${qChild}比如${qHard}，那时候只想着咬紧牙关撑起这个家。老天是公平的，汗水过后，我迎来了${qPeak}。这就是我平凡生活里的英雄梦想。${exAdult}`,
      ch4:
        `如今日子归于平静。我用大半辈子总结出一个道理：${qLegacy}。${exMiddle}今天坐在这里回忆往事，千言万语汇成一句话送给孩子们：${qMsg}。平安健康，比什么都强。`,
    },
    {
      title: '一生一事：我的奋斗纪实',
      ch1:
        `我是${name}。时间追溯到${bYear}的${bPlace}${gPlace}。很多人认识我，是因为我${tag}的身份。但在我${age}的回忆里，一切起点都源自童年时${qSense}。那时候，一个想要${qDream}的梦想，埋下了一生的种子。${exChild}`,
      ch2:
        `社会是一场历练。用汗水换来的${qItem}，是我走向独立的标志。当我第一次完成了${qAchieve}，仿佛打通了任督二脉，找到了方向。${qLove ? `在追求事业的同时，我也组建了家庭，${qLove}` : ''}${exYouth}`,
      ch3:
        `要干出名堂，就得脱几层皮。${qChild}在攻坚克难的岁月里，最让我刻骨铭心的是${qHard}。但我坚信没有过不去的坎。终于，我攀上了高峰，完成了${qPeak}。那份底气是任何东西都换不来的。${exAdult}`,
      ch4:
        `几十年的专注，让我到了该退役的时候。我把毕生所学和${qLegacy}交给了下一代。${exMiddle}视频最后，我想对年轻一代说：${qMsg}。专注做好一件事，时间会给你最好的答案。`,
    },
    {
      title: '光影斑驳：我的岁月长卷',
      ch1:
        `岁月在我的生命里，刻下了${name}这个名字。${bYear}，在${bPlace}${gPlace}。兜兜转转，我以${tag}的身份步入了${age}。到了这个年纪，记忆反倒像被水洗过一样清晰。我能真切感受到小时候${qSense}，那是最初的诗意，伴随着${qDream}的憧憬。${exChild}`,
      ch2:
        `青春的画卷铺开，色彩变得浓烈。那件${qItem}是我青涩岁月的见证。当我第一次${qAchieve}，心里的成就感轰轰烈烈。${qLove ? `画卷里不仅有奋斗，还有温情，${qLove}` : ''}${exYouth}`,
      ch3:
        `画卷的中间部分，充满了沉重的暗色调。${qChild}那是${qHard}的日子。我用顽强的笔触涂抹，直到迎来了最绚烂的色彩——${qPeak}。这是我用生命谱写的乐章。${exAdult}`,
      ch4:
        `如今画卷即将收尾，留下大片留白。我想给世界留下的，是${qLegacy}。${exMiddle}孩子们，关于未来我只有一句期许：${qMsg}。愿你们的光影长卷同样精彩。`,
    },
    {
      title: '枝繁叶茂：我的成长手记',
      ch1:
        `人生就像一棵树。我这棵树的种子落在${bYear}的${bPlace}${gPlace}。几十年过去，步入${age}，社会给我贴上了${tag}的标签。但在树根深处，藏着小时候${qSense}的记忆，那是我${qDream}的萌芽期。${exChild}`,
      ch2:
        `青年时我拼命汲取养分。那件${qItem}像长出的新叶，充满生机。当我第一次${qAchieve}，我知道自己有了抵御风浪的能力。${qLove ? `很快，另一棵树与我并肩而立，${qLove}` : ''}${exYouth}`,
      ch3:
        `大自然的风暴总会来临。${qChild}在${qHard}的日子里，树干差点被折断，我只能把根扎得更深。风雨过后，我不仅结出了果实，还迎来了最繁茂的时期——${qPeak}。${exAdult}`,
      ch4:
        `现在叶子渐渐黄了，但我并不悲伤。我已经把${qLegacy}的种子播撒给了后辈。${exMiddle}我的孩子们，面对风雨记住：${qMsg}。像大树一样坚韧而挺拔地生活。`,
    },
    {
      title: '笑看风云：我的向阳人生',
      ch1:
        `我是${name}，一个${bYear}生于${bPlace}${gPlace}的乐天派。对于现在${age}的我来说，能以${tag}的身份生活，就是一场有趣的体验。提起小时候，我满脑子都是${qSense}，还有那个逗得人直笑的${qDream}的梦。${exChild}`,
      ch2:
        `年轻时快乐很简单。买到心心念念的${qItem}，走路都带风。当我在工作中${qAchieve}时，我心想：嘿，我真是个天才！这份喜悦支撑了我很久。${qLove ? `当然，最幸运的还是感情，${qLove}` : ''}${exYouth}`,
      ch3:
        `虽然生活会开残酷的玩笑，${qChild}比如${qHard}，但哪怕哭着我也告诉自己要向前看。凭着不服输的乐观，我拿下了${qPeak}这个大成就。老天爷终究偏爱爱笑的人。${exAdult}`,
      ch4:
        `如今日子闲下来了，我总笑着对年轻人说，干咱们这行，核心就是${qLegacy}。${exMiddle}视频前的子孙们，我把秘诀传给你们：${qMsg}。只要太阳照常升起，就没有什么大不了的。`,
    },
    {
      title: '时代浪潮：我的岁月见证',
      ch1:
        `作为时代洪流中的一滴水，我的名字叫${name}。${bYear}，我随着浪潮降生在${bPlace}${gPlace}。如今步入${age}，作为一个${tag}，我也算是见证了变迁。翻开记忆的扉页，是那股${qSense}的时代气息，我就发誓要${qDream}。${exChild}`,
      ch2:
        `社会的车轮滚滚向前。拥有的第一件${qItem}，是我跟上潮流的印记。当我顺应大势完成了${qAchieve}，我深刻感受到个人命运与时代紧紧相连。${qLove ? `在那个激情燃烧的年代，${qLove}` : ''}${exYouth}`,
      ch3:
        `在巨变中，我也有过迷茫。${qChild}比如在${qHard}那个关口，稍有不慎就会被甩下车。但我顶住了压力，顺势而为，创造了属于我的历史——${qPeak}。那是时代赋予我的荣光。${exAdult}`,
      ch4:
        `潮水退去，留下的是经验。我常跟后辈提起，无论时代怎么变，${qLegacy}的道理不能丢。${exMiddle}站在时间的这一头，我想对走向未来的子孙说：${qMsg}。勇敢去拥抱你们的新时代吧。`,
    },
  ];

  const randomIndex = Math.floor(Math.random() * templates.length);
  const selected = templates[randomIndex];

  const chapters: DirectorScriptPayload['chapters'] = [
    {
      chapter_name: '第一乐章：原乡',
      voice_over: collapseDuplicatePeriods(selected.ch1),
    },
    {
      chapter_name: '第二乐章：青涩',
      voice_over: collapseDuplicatePeriods(selected.ch2),
    },
    {
      chapter_name: '第三乐章：风雨',
      voice_over: collapseDuplicatePeriods(selected.ch3),
    },
    {
      chapter_name: '第四乐章：回响',
      voice_over: collapseDuplicatePeriods(selected.ch4),
    },
  ];

  return {
    title: selected.title,
    chapters,
  };
}

/** 问卷数据 → 导演分镜 JSON（纯本地模板）。lifeFiveAnswers 须为完整对象（含 q_love_marriage、q_children、q_extra_childhood 等），与 Context 中 getSubmissionPayload 一致。 */
export function buildLocalDirectorScript(data: MemoirData): DirectorScriptPayload {
  return generateLocalScript(data.lifeFiveAnswers, data.basicInfo);
}

export function generateMemoirScript(data: MemoirData): string {
  const { basicInfo, lifeStages, lifeFiveAnswers } = data;

  if (hasLifeFiveContent(lifeFiveAnswers)) {
    const d = generateLocalScript(lifeFiveAnswers, basicInfo);
    const voiceText = d.chapters
      .map(c => c.voice_over.trim())
      .filter(Boolean)
      .join('\n\n');
    return d.title ? `${d.title}\n\n${voiceText}` : voiceText;
  }

  const filledStages = lifeStages.filter(s => s.content.trim() && !s.skipped);

  if (filledStages.length === 0) {
    return buildMinimalScript(basicInfo);
  }

  const parts: string[] = [];
  parts.push(buildOpening(basicInfo));
  filledStages.forEach(stage => {
    parts.push(buildStageNarration(stage, basicInfo));
  });
  parts.push(buildClosing(basicInfo, filledStages, filledStages.some(s => s.id === 'message')));

  return parts.join('\n\n');
}

function buildMinimalScript(info: BasicInfo): string {
  const name = info.name || '主人公';
  const p = pronoun(info.gender);
  const birthPart = info.birthYear
    ? `${info.birthYear}年出生${info.birthPlace ? `于${info.birthPlace}` : ''}，`
    : '';

  return (
    `这是${name}的人生故事。\n\n` +
    `${birthPart}${p}用自己的方式，走过了这段属于自己的岁月。` +
    `有喜悦，有辛苦，有牵挂，也有骄傲。\n\n` +
    `每一段人生都值得被温柔记录，每一个故事都值得被永远珍藏。\n\n` +
    `这就是${name}，独一无二的${p}。`
  );
}

export function generatePhotoSuggestions(data: MemoirData): any {
  const { lifeStages, lifeFiveAnswers } = data;

  if (hasLifeFiveContent(lifeFiveAnswers)) {
    const blocks = [
      { id: 'five_1', title: '原乡与启蒙（0–18 岁）', min: 3, max: 5 },
      { id: 'five_2', title: '青涩与入行（19–30 岁）', min: 2, max: 4 },
      { id: 'five_3', title: '风雨与巅峰（31–50 岁）', min: 4, max: 6 },
      { id: 'five_4', title: '沉淀与交棒（51–65 岁）', min: 2, max: 4 },
      { id: 'five_5', title: '回响与寄语（65 岁+）', min: 2, max: 4 },
    ];
    const keysByBlock: (keyof LifeFivePartAnswers)[][] = [
      ['q_childhood_sense', 'q_early_dream', 'q_extra_childhood'],
      ['q_youth_item', 'q_first_achievement', 'q_love_marriage', 'q_extra_youth'],
      ['q_hardest_moment', 'q_career_peak', 'q_children', 'q_extra_adult'],
      ['q_legacy', 'q_extra_middle_age'],
      ['q_final_message'],
    ];
    const suggestions: any = { stages: [], total: { min: 0, max: 0 } };
    keysByBlock.forEach((keys, i) => {
      const has = keys.some(k => lifeFiveAnswers[k]?.trim());
      if (has) {
        const range = blocks[i];
        suggestions.stages.push(range);
        suggestions.total.min += range.min;
        suggestions.total.max += range.max;
      }
    });
    if (suggestions.stages.length === 0) {
      suggestions.total = { min: 25, max: 40 };
      suggestions.stages = blocks.map(b => ({ title: b.title, min: b.min, max: b.max }));
    }
    return suggestions;
  }

  const photoRanges: Record<string, { min: number; max: number }> = {
    impression:   { min: 1, max: 2 },
    childhood:    { min: 3, max: 5 },
    primary:      { min: 2, max: 4 },
    youth:        { min: 2, max: 4 },
    society:      { min: 2, max: 3 },
    career:       { min: 4, max: 6 },
    marriage:     { min: 4, max: 8 },
    children:     { min: 3, max: 6 },
    turning:      { min: 2, max: 3 },
    achievement:  { min: 2, max: 4 },
    recent:       { min: 3, max: 5 },
    message:      { min: 1, max: 2 },
  };

  const suggestions: any = { stages: [], total: { min: 0, max: 0 } };

  lifeStages.forEach(stage => {
    if (!stage.skipped && stage.content.trim()) {
      const range = photoRanges[stage.id] || { min: 2, max: 4 };
      suggestions.stages.push({ id: stage.id, title: stage.title, ...range });
      suggestions.total.min += range.min;
      suggestions.total.max += range.max;
    }
  });

  if (suggestions.stages.length === 0) {
    suggestions.total = { min: 25, max: 40 };
    suggestions.stages = [
      { title: '童年阶段',     min: 3, max: 5 },
      { title: '少年阶段',     min: 2, max: 4 },
      { title: '青春求学阶段', min: 2, max: 4 },
      { title: '工作事业阶段', min: 4, max: 6 },
      { title: '家庭生活阶段', min: 4, max: 8 },
      { title: '近年生活阶段', min: 3, max: 5 },
    ];
  }

  return suggestions;
}
