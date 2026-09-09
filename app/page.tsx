'use client';
import { useEffect, useState } from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Camera,
  Check,
  ChevronRight,
  Dumbbell,
  Footprints,
  Leaf,
  LockKeyhole,
  Moon,
  RefreshCw,
  Utensils,
  CalendarDays,
  LayoutDashboard,
  HeartPulse,
  MessageCircle,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

type RecordRow = Record<string, string>;
type Photo = { folder: string; date: string; files: string[] };
type JourneyEntry = { date: string; title: string; summary: string };
type Data = {
  records: RecordRow[];
  photos: Photo[];
  journey: JourneyEntry[];
};
const short = (s: string) => s.slice(5).replace('-', '.');
const num = (v: string | undefined) => (v ? Number(v) : null);
const show = (v: string | undefined) => v || '未记录';
const photoUrl = (folder: string, file: string) =>
  `/api/photo?path=${encodeURIComponent(folder + '/' + file)}`;
const plan = [
  {
    date: '2025-01-06',
    day: '周一',
    name: '轻松跑',
    detail: '示例跑步记录',
    kind: '跑步',
  },
  {
    date: '2025-01-07',
    day: '周二',
    name: '恢复日',
    detail: '示例休息安排',
    kind: '恢复',
  },
  {
    date: '2025-01-08',
    day: '周三',
    name: '舞蹈练习',
    detail: '示例活动',
    kind: '舞蹈',
  },
  {
    date: '2025-01-09',
    day: '周四',
    name: '力量练习',
    detail: '示例力量安排',
    kind: '力量',
  },
  {
    date: '2025-01-10',
    day: '周五',
    name: '轻松跑',
    detail: '示例跑步安排',
    kind: '跑步',
  },
  {
    date: '2025-01-11',
    day: '周六',
    name: '恢复日',
    detail: '示例休息安排',
    kind: '恢复',
  },
  {
    date: '2025-01-12',
    day: '周日',
    name: '自由活动',
    detail: '示例活动安排',
    kind: '恢复',
  },
];
const meals = [
  ['pre_run_kcal', '跑前', '训练前补给'],
  ['breakfast_kcal', '早餐', '一天的开始'],
  ['lunch_kcal', '午餐', '主要正餐'],
  ['snack_kcal', '加餐 / 饮料', '零食与含热量饮品'],
  ['dinner_kcal', '晚餐', '晚间正餐'],
];
const budget: Record<string, number> = Object.fromEntries(
  Array.from({ length: 7 }, (_, i) => [`D${i + 1}`, 2000]),
);
function Picker({
  value,
  onChange,
  items,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  items: { value: string; label: string }[];
  label: string;
}) {
  return (
    <Select value={value} onValueChange={(v) => v && onChange(v)} items={items}>
      <SelectTrigger aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((i) => (
          <SelectItem value={i.value} key={i.value}>
            {i.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
export default function Home() {
  const [data, setData] = useState<Data | null>(null),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(false),
    [date, setDate] = useState(''),
    [angle, setAngle] = useState('front'),
    [before, setBefore] = useState(''),
    [after, setAfter] = useState('');
  async function refresh() {
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/dashboard', { cache: 'no-store' });
      const d = (await r.json()) as Data & { error?: string };
      if (!r.ok) throw Error(d.error);
      setData(d);
      setDate((prev) => prev || d.records.at(-1)?.date || '');
      setBefore((prev) => prev || d.photos[0]?.folder || '');
      setAfter((prev) => prev || d.photos.at(-1)?.folder || '');
    } catch (e) {
      setError(e instanceof Error ? e.message : '读取失败');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void refresh();
  }, []);
  const records = data?.records || [],
    mornings = records.filter((r) => r.weigh_time === 'morning' && r.weight_kg),
    latest = mornings.at(-1),
    baseline = mornings[0],
    waistRecords = records.filter((r) => r.waist_cm),
    latestWaist = waistRecords.at(-1),
    baselineWaist = waistRecords[0],
    selected = records.find((r) => r.date === date),
    days = records.filter((r) => r.menu_day),
    start = records.find((r) => r.weigh_time === 'evening');
  const current = Number(latest?.weight_kg || 0),
    base = Number(baseline?.weight_kg || 0),
    lost = base - current,
    waistChange =
      latestWaist && baselineWaist
        ? Number(latestWaist.waist_cm) - Number(baselineWaist.waist_cm)
        : null,
    target = 68,
    progress =
      base > target
        ? Math.max(0, Math.min(100, (lost / (base - target)) * 100))
        : 0;
  const today = '2025-01-12'; // Fixed date for fictional demo records.
  const todayPlan = plan.find((p) => p.date === today),
    elapsed = Math.max(
      1,
      Math.min(
        7,
        Math.floor((Date.parse(today) - Date.parse('2025-01-06')) / 86400000) +
          1,
      ),
    );
  const currentKcal = num(selected?.calories_kcal),
    protein = num(selected?.protein_g),
    planned = budget[selected?.menu_day || ''];
  const recent = latest
    ? mornings.filter(
        (r) => Date.parse(r.date) >= Date.parse(latest.date) - 6 * 86400000,
      )
    : [];
  const average =
    recent.length === 7
      ? recent.reduce((s, r) => s + Number(r.weight_kg), 0) / 7
      : null;
  const photoItems = (data?.photos || []).map((p) => ({
    value: p.folder,
    label: short(p.date) + ' · ' + p.folder.split('_')[1],
  }));
  return (
    <main className="shell" id="top">
      <a className="skip-link" href="#dashboard-content">
        跳到记录模块
      </a>
      <header className="topbar">
        <a href="#top" className="brand">
          <span className="brand-icon">
            <Leaf size={22} />
          </span>
          轻一点<span className="brand-sub">示例减重手记</span>
        </a>
        <div className="top-actions">
          <span className="local">
            <LockKeyhole size={14} /> 仅本机
          </span>
          <button className="refresh" onClick={refresh} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            <span>{loading ? '读取中' : '刷新记录'}</span>
          </button>
        </div>
      </header>
      <div className="page-heading">
        <div>
          <p className="eyebrow">虚构示例 · 2025.01.06 / 01.12</p>
          <h1>我的减重进度</h1>
        </div>
        <div className="period">
          <span>
            计划第 <b>{elapsed}</b> 天
          </span>
          <span>
            共 7 天 ·{' '}
            {elapsed <= 7
              ? '校准周'
              : elapsed <= 28
                ? '主减脂期'
                : elapsed <= 46
                  ? '冲刺期'
                  : '稳定收尾'}
          </span>
        </div>
      </div>
      {error && (
        <div className="error" role="alert">
          {error}
          <button onClick={refresh}>重试</button>
        </div>
      )}
      {!data ? (
        <div className="loading" role="status">
          {error ? '本地数据暂不可用' : '正在读取你的减重记录…'}
        </div>
      ) : (
        <>
          <section className="overview" aria-label="减重进度">
            <div className="weight-summary">
              <div className="section-kicker">
                <Activity size={18} /> 最新晨重{' '}
                <span>{latest ? short(latest.date) : '未记录'}</span>
              </div>
              <div className="weight">
                {latest ? current.toFixed(2) : '--'}
                <span>kg</span>
              </div>
              <div className="change">
                {lost >= 0 ? (
                  <ArrowDownRight size={18} />
                ) : (
                  <ArrowUpRight size={18} />
                )}
                {lost >= 0 ? '下降' : '上升'} {Math.abs(lost).toFixed(2)} kg
                <span>较首日晨重</span>
              </div>
              <div className="target-summary">
                <div>
                  <span>晨起基线</span>
                  <strong>
                    {baseline ? base : '--'} <small>kg</small>
                  </strong>
                </div>
                <ChevronRight size={17} />
                <div>
                  <span>示例目标</span>
                  <strong>
                    68 <small>kg</small>
                  </strong>
                </div>
                <div className="target-percent">
                  {progress.toFixed(1)}
                  <small>%</small>
                </div>
              </div>
              <Progress
                value={progress}
                aria-label="从晨起基线到示例目标的进度"
              />
              <p className="caption">
                所有日期、体重和目标均为虚构演示，不构成健康建议
              </p>
              <div className="waist-summary">
                <div>
                  <span>肚脐水平腰围</span>
                  <strong>
                    {latestWaist
                      ? Number(latestWaist.waist_cm).toFixed(1)
                      : '--'}
                    <small> cm</small>
                  </strong>
                </div>
                <p>
                  {latestWaist
                    ? `${short(latestWaist.date)} 记录${waistChange != null && waistRecords.length > 1 ? ` · 较首次${waistChange <= 0 ? '减少' : '增加'} ${Math.abs(waistChange).toFixed(1)} cm` : ''}`
                    : '等待首次晨间测量'}
                </p>
              </div>
            </div>
            <div className="chart-panel">
              <div className="section-head">
                <h2>体重趋势</h2>
                <span className="legend">
                  <i /> 晨起体重
                </span>
              </div>
              <WeightChart records={mornings} />
              <div className="chart-foot">
                <span>
                  7 日均重{' '}
                  <b>{average ? average.toFixed(2) + ' kg' : '数据不足'}</b>
                </span>
                <span>晚间起点 {start?.weight_kg || '--'} kg 单独留档</span>
              </div>
            </div>
          </section>
          <div className="status-strip">
            <div>
              <CalendarDays size={18} />
              <strong>{todayPlan ? '今日安排' : '计划记录'}</strong>
              <span>
                {todayPlan
                  ? `${short(today)} · ${todayPlan.name}，${todayPlan.detail}`
                  : '查看下方训练日历与每日记录'}
              </span>
            </div>
            <span>
              {days.length} 天饮食记录 · {data.photos.length} 组体型照片
            </span>
          </div>
          <Tabs
            defaultValue="overview"
            className="dashboard-tabs"
            id="dashboard-content"
          >
            <TabsList className="main-tabs" variant="line">
              <TabsTrigger value="overview">
                <LayoutDashboard size={17} />
                总览
              </TabsTrigger>
              <TabsTrigger value="nutrition">
                <Utensils size={17} />
                饮食
              </TabsTrigger>
              <TabsTrigger value="exercise">
                <Dumbbell size={17} />
                运动
              </TabsTrigger>
              <TabsTrigger value="photos">
                <Camera size={17} />
                对比照
              </TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <div className="content-grid">
                {renderNutrition({})}
                {renderExercise({})}
              </div>
              {renderRecovery()}
              {renderPhotos()}
            </TabsContent>
            <TabsContent value="nutrition">
              {renderNutrition({ full: true })}
              <section className="panel menu-notes">
                <div className="section-head">
                  <h2>七天食谱与执行计划</h2>
                  <Utensils size={19} />
                </div>
                <p>
                  数值均为虚构演示，用于展示记录和目标的排版；未记录的数值不视为零。
                </p>
                <div className="document-links">
                  {['七天食谱.md', '减重执行计划.md'].map((d) => (
                    <a
                      target="_blank"
                      rel="noreferrer"
                      href={'/api/document?name=' + encodeURIComponent(d)}
                      key={d}
                    >
                      {d.replace('.md', '')}
                      <ArrowUpRight size={16} />
                    </a>
                  ))}
                </div>
              </section>
            </TabsContent>
            <TabsContent value="exercise">
              {renderExercise({ full: true })}
              <section className="panel recovery">
                <h2>恢复记录</h2>
                <div className="recovery-grid">
                  {days.map((r) => (
                    <div key={r.date}>
                      <span>{short(r.date)}</span>
                      <strong>
                        <Moon size={17} />
                        {show(r.sleep_h)}
                        {r.sleep_h ? ' h' : ''}
                      </strong>
                      <p>{r.symptoms || '症状未记录'}</p>
                    </div>
                  ))}
                </div>
                <a
                  className="text-link"
                  target="_blank"
                  rel="noreferrer"
                  href={
                    '/api/document?name=' +
                    encodeURIComponent('一周训练计划.md')
                  }
                >
                  查看完整训练计划 <ArrowUpRight size={15} />
                </a>
              </section>
            </TabsContent>
            <TabsContent value="photos">
              {renderPhotos()}
              {renderMealPhotos()}
            </TabsContent>
          </Tabs>
          {renderJourney()}
          <footer>
            <span>
              <LockKeyhole size={13} /> 数据与照片保存在本机
            </span>
            <span>最新日志 {records.at(-1)?.date} · 缺失记录不作推测</span>
          </footer>
        </>
      )}
    </main>
  );
  function renderJourney() {
    const entries = [...(data?.journey || [])].sort((a, b) =>
      b.date.localeCompare(a.date),
    );
    return (
      <section className="panel journey" aria-labelledby="journey-title">
        <div className="journey-heading">
          <div className="journey-icon" aria-hidden="true">
            <MessageCircle size={20} />
          </div>
          <div>
            <p className="section-kicker">不只记录数字</p>
            <h2 id="journey-title">心路历程</h2>
            <p>此处展示虚构的个人手记示例。</p>
          </div>
          <span>{entries.length} 则记录</span>
        </div>
        {entries.length ? (
          <div className="journey-stream">
            {entries.map((entry, index) => (
              <article
                className={'journey-entry ' + (index === 0 ? 'latest' : '')}
                key={entry.date}
              >
                <time dateTime={entry.date}>{short(entry.date)}</time>
                <div>
                  <h3>{entry.title}</h3>
                  <p>{entry.summary}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="journey-empty">等待第一则心路记录。</p>
        )}
      </section>
    );
  }
  function renderNutrition({ full = false }: { full?: boolean }) {
    return (
      <section className={'panel nutrition ' + (full ? 'full' : '')}>
        <div className="section-head">
          <h2>
            <Utensils size={19} />
            饮食记录
          </h2>
          <Picker
            value={date}
            onChange={setDate}
            items={days.map((r) => ({
              value: r.date,
              label: short(r.date) + ' · ' + r.menu_day,
            }))}
            label="选择饮食日期"
          />
        </div>
        <div className="nutrition-summary">
          <div>
            <span className="muted">已记录摄入 · 估算</span>
            <strong>
              {currentKcal ?? '--'}
              <small>kcal</small>
            </strong>
          </div>
          <div className="budget">
            <span>当日预算</span>
            <b>{planned || '--'} kcal</b>
          </div>
        </div>
        <Progress
          value={
            currentKcal != null && planned
              ? Math.min(100, (currentKcal / planned) * 100)
              : 0
          }
          aria-label="热量预算使用比例"
          className={
            currentKcal != null && planned && currentKcal > planned
              ? 'over'
              : ''
          }
        />
        <div className="nutrition-foot">
          <span>
            {currentKcal == null
              ? '尚未记录'
              : currentKcal < planned
                ? '记录摄入低于示例预算'
                : currentKcal > planned
                  ? `较预算多 ${currentKcal - planned} kcal`
                  : `距预算 ${planned - currentKcal} kcal`}
          </span>
          <span>含用油与饮料</span>
        </div>
        <NutritionDays days={days} selectedDate={date} onSelect={setDate} />
        <div className="meal-list">
          {meals.map(([key, label, desc], i) => (
            <div className="meal-row" key={key}>
              <span className="meal-no">0{i + 1}</span>
              <div>
                <strong>{label}</strong>
                {full && <p>{desc}</p>}
              </div>
              <b>
                {selected?.[key] !== '' && selected?.[key] != null
                  ? selected[key]
                  : '未记录'}
                <small>
                  {selected?.[key] !== '' && selected?.[key] != null
                    ? ' kcal'
                    : ''}
                </small>
              </b>
            </div>
          ))}
        </div>
        <div className="protein">
          <span>
            <Leaf size={16} /> 蛋白质
          </span>
          <strong>
            {protein ?? '--'} <small>/ 120 g 示例目标</small>
          </strong>
        </div>
        <Progress
          value={protein != null ? Math.min(100, (protein / 120) * 100) : 0}
          aria-label="蛋白质目标进度"
        />
        <p className="caption">
          蛋白质示例目标 120 g ·{' '}
          {selected?.notes.includes('partial-day')
            ? '当日记录待最终确认'
            : selected?.notes.includes('day closed')
              ? '当日已结算'
              : '待确认结算状态'}
        </p>
      </section>
    );
  }
  function renderExercise({ full = false }: { full?: boolean }) {
    const runTotal = days.reduce(
        (s, r) => s + Number(r.run_distance_km || 0),
        0,
      ),
      danceTotal = days.reduce((s, r) => s + Number(r.dance_minutes || 0), 0);
    return (
      <section className={'panel exercise ' + (full ? 'full' : '')}>
        <div className="section-head">
          <h2>
            <Dumbbell size={19} />
            运动与恢复
          </h2>
          <span className="muted">第一周</span>
        </div>
        <div className="exercise-totals">
          <div>
            <Footprints size={19} />
            <strong>
              {runTotal.toFixed(2)}
              <small>km</small>
            </strong>
            <span>已记录跑步</span>
          </div>
          <div>
            <Activity size={19} />
            <strong>
              {danceTotal}
              <small>min</small>
            </strong>
            <span>已记录舞蹈</span>
          </div>
        </div>
        <div className="schedule">
          {plan.map((p) => {
            const r = records.find((r) => r.date === p.date),
              cancelled =
                p.kind === '跑步' && Boolean(r?.run_type.startsWith('skipped')),
              done =
                !cancelled &&
                (p.kind === '跑步'
                  ? Number(r?.run_distance_km) > 0
                  : p.kind === '舞蹈'
                    ? Number(r?.dance_minutes) > 0
                    : p.kind === '力量'
                      ? Boolean(r?.strength_session)
                      : false);
            return (
              <div
                className={'schedule-row ' + (p.date === today ? 'today' : '')}
                key={p.date}
              >
                <div className="schedule-date">
                  <b>{short(p.date)}</b>
                  <span>{p.day}</span>
                </div>
                <div className="schedule-name">
                  <strong>{p.name}</strong>
                  <span>
                    {done
                      ? p.kind === '跑步'
                        ? `已跑 ${r?.run_distance_km} km`
                        : p.kind === '舞蹈'
                          ? `已记录 ${r?.dance_minutes} 分钟`
                          : r?.strength_session
                      : p.detail}
                  </span>
                </div>
                <span
                  className={
                    'schedule-state ' +
                    (done ? 'done' : cancelled ? 'cancelled' : '')
                  }
                >
                  {done ? (
                    <Check size={17} />
                  ) : cancelled ? (
                    '已取消'
                  ) : p.kind === '恢复' ? (
                    '休息'
                  ) : p.date < today ? (
                    '未记录'
                  ) : (
                    '计划'
                  )}
                </span>
              </div>
            );
          })}
        </div>
        <p className="caption">
          舞蹈计入恢复负荷，不折算为可吃回热量。取消的训练不补做。
        </p>
        {full && <p className="caption">运动时长只累计已填写的示例记录。</p>}
      </section>
    );
  }

  function renderRecovery() {
    const r = days.at(-1);
    if (!r) return null;
    return (
      <section className="recovery-band" aria-label="最新恢复记录">
        <div className="recovery-heading">
          <HeartPulse size={22} />
          <div>
            <h2>也看看身体的感受</h2>
            <span>最近记录 · {short(r.date)}</span>
          </div>
        </div>
        <div className="recovery-value">
          <span>睡眠</span>
          <strong>
            {show(r.sleep_h)}
            <small>{r.sleep_h ? ' 小时' : ''}</small>
          </strong>
        </div>
        <div className="recovery-value">
          <span>疼痛记录</span>
          <strong>
            {show(r.pain_0_10)}
            <small>{r.pain_0_10 ? ' / 10' : ''}</small>
          </strong>
        </div>
        <div className="recovery-note">
          <span>当日体感</span>
          <p>{r.symptoms || '尚未记录'}</p>
          <span>按你的原始记录呈现</span>
        </div>
      </section>
    );
  }
  function renderPhotos() {
    return (
      <section className="panel photos">
        <div className="section-head">
          <div className="photo-heading">
            <h2>
              <Camera size={19} />
              体型对比
            </h2>
            <p>用相同的角度，留住变化。</p>
          </div>
          <Tabs value={angle} onValueChange={(v) => setAngle(String(v))}>
            <TabsList className="angle-tabs">
              <TabsTrigger value="front">正面</TabsTrigger>
              <TabsTrigger value="side_left">左侧面</TabsTrigger>
              <TabsTrigger value="side_right">右侧面</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        {photoItems.length ? (
          <>
            <div className="photo-grid">
              {[before, after].map((folder, i) => {
                const entry = data?.photos.find((p) => p.folder === folder),
                  exists = entry?.files.includes(angle + '.jpeg');
                return (
                  <figure key={i}>
                    <div className="photo-label">
                      <span>{i === 0 ? '对比起点' : '对比日期'}</span>
                      <Picker
                        value={folder}
                        onChange={i === 0 ? setBefore : setAfter}
                        items={photoItems}
                        label={i === 0 ? '起点照片日期' : '对比照片日期'}
                      />
                    </div>
                    {exists ? (
                      <a
                        href={photoUrl(folder, angle + '.jpeg')}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={'查看' + entry?.date + '体型照片原图'}
                      >
                        <img
                          src={photoUrl(folder, angle + '.jpeg')}
                          alt={`${entry?.date} ${angle === 'front' ? '正面' : angle === 'side_left' ? '左侧面' : '右侧面'}体型记录`}
                          loading="lazy"
                        />
                      </a>
                    ) : (
                      <div className="photo-empty">该日期暂无此角度照片</div>
                    )}
                  </figure>
                );
              })}
            </div>
            <p className="caption">
              {before === after
                ? '当前选择了同一天，可切换日期进行对比。'
                : '尽量使用相同光线、距离和站姿，以周度变化为主。'}{' '}
              点击照片查看原图，不从照片推断体脂率。
            </p>
          </>
        ) : (
          <div className="photo-empty">尚无已归档的体型照片</div>
        )}
      </section>
    );
  }
  function renderMealPhotos() {
    const items =
      data?.photos.flatMap((p) =>
        p.files
          .filter((f) => f.startsWith('meal_'))
          .map((f) => ({ ...p, file: f })),
      ) || [];
    return (
      <section className="panel">
        <div className="section-head">
          <h2>餐食相册</h2>
          <Utensils size={19} />
        </div>
        <div className="food-grid">
          {items.map((p) => (
            <figure key={p.folder + p.file}>
              <a
                href={photoUrl(p.folder, p.file)}
                target="_blank"
                rel="noreferrer"
              >
                <img
                  src={photoUrl(p.folder, p.file)}
                  alt={
                    p.date +
                    (p.file === 'meal_lunch.jpeg' ? '午餐' : '晚餐进食前')
                  }
                  loading="lazy"
                />
              </a>
              <figcaption>
                {short(p.date)} ·{' '}
                {p.file === 'meal_lunch.jpeg' ? '午餐' : '晚餐 · 进食前'}
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="caption">照片用于核对份量，实际摄入以日志为准。</p>
      </section>
    );
  }
}
function WeightChart({ records }: { records: RecordRow[] }) {
  if (!records.length)
    return <div className="photo-empty">等待第一条晨重记录</div>;
  const values = records.map((r) => Number(r.weight_kg)),
    min = Math.floor((Math.min(...values) - 0.25) * 2) / 2,
    max = Math.ceil((Math.max(...values) + 0.25) * 2) / 2,
    first = Date.parse(records[0].date),
    last = Date.parse(records.at(-1)!.date),
    range = Math.max(86400000, last - first);
  const x = (date: string) => 60 + ((Date.parse(date) - first) / range) * 550,
    y = (v: number) => 190 - ((v - min) / (max - min)) * 140;
  const points = records
    .map((r) => `${x(r.date)},${y(Number(r.weight_kg))}`)
    .join(' ');
  return (
    <div className="chart">
      <svg
        viewBox="0 0 670 240"
        role="img"
        aria-label={
          '晨重趋势：' +
          records.map((r) => `${r.date} ${r.weight_kg}公斤`).join('，')
        }
      >
        <defs>
          <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#205c46" stopOpacity=".15" />
            <stop offset="100%" stopColor="#205c46" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((i) => {
          const v = min + ((max - min) * i) / 3;
          return (
            <g key={i}>
              <line
                x1="52"
                x2="625"
                y1={y(v)}
                y2={y(v)}
                stroke="#e5ebe8"
                strokeDasharray="3 5"
              />
              <text x="0" y={y(v) + 5} fill="#626f65" fontSize="13">
                {v.toFixed(1)}
              </text>
            </g>
          );
        })}
        <polygon
          points={`${x(records[0].date)},195 ${points} ${x(records.at(-1)!.date)},195`}
          fill="url(#area)"
        />
        <polyline
          points={points}
          fill="none"
          stroke="#205c46"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {records.map((r, i) => (
          <g key={r.date}>
            <circle
              cx={x(r.date)}
              cy={y(Number(r.weight_kg))}
              r="5"
              fill="#fff"
              stroke="#205c46"
              strokeWidth="3"
            >
              <title>
                {r.date} · {r.weight_kg} kg
              </title>
            </circle>
            {(i === 0 || i === records.length - 1) && (
              <>
                <text
                  x={x(r.date)}
                  y={y(Number(r.weight_kg)) - 17}
                  textAnchor="middle"
                  fill="#205c46"
                  fontSize="16"
                  fontWeight="600"
                >
                  {r.weight_kg}
                </text>
                <text
                  x={x(r.date)}
                  y="228"
                  textAnchor="middle"
                  fill="#626f65"
                  fontSize="13"
                >
                  {short(r.date)}
                </text>
              </>
            )}
          </g>
        ))}
      </svg>
      <p className="caption">
        {records.length} 次晨重记录 · 连线仅连接已有测量，缺失日期未补值
      </p>
    </div>
  );
}

function NutritionDays({
  days,
  selectedDate,
  onSelect,
}: {
  days: RecordRow[];
  selectedDate: string;
  onSelect: (date: string) => void;
}) {
  const scale = Math.max(
    2200,
    ...days.map((r) => Number(r.calories_kcal || 0)),
  );
  const anchor = Date.parse(selectedDate || days.at(-1)?.date || '2025-01-06');
  const weekStart =
    anchor -
    (((Math.floor((anchor - Date.parse('2025-01-06')) / 86400000) % 7) + 7) %
      7) *
      86400000;
  const dates = Array.from({ length: 7 }, (_, i) =>
    new Date(weekStart + i * 86400000).toISOString().slice(0, 10),
  );
  return (
    <div className="nutrition-week">
      <div className="week-heading">
        <span>每天的摄入</span>
        <span>选择日期查看明细</span>
      </div>
      <div className="intake-days">
        {dates.map((date) => {
          const r = days.find((d) => d.date === date),
            v = num(r?.calories_kcal),
            active = date === selectedDate;
          return (
            <button
              key={date}
              className={'intake-day ' + (active ? 'selected' : '')}
              disabled={!r}
              onClick={() => onSelect(date)}
              aria-pressed={active}
              aria-label={`${date}，${v === null ? '未记录' : v + ' kcal'}${active ? '，已选中' : ''}`}
            >
              <span className="intake-number">{v === null ? '未记' : v}</span>
              <span className="intake-track">
                <span
                  className="intake-fill"
                  style={{
                    height: v === null ? '0%' : `${(v / scale) * 100}%`,
                  }}
                />
              </span>
              <span className="intake-date">{short(date)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
