'use client';
import { useEffect, useState } from 'react';
import { weekRange, metric } from '@/lib/statistics';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Camera,
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
type DietAdvice = {
  as_of_date: string;
  window_days: number;
  based_on_dates: string[];
  title: string;
  summary: string;
  observations: string[];
  actions: string[];
  next_day_focus: string;
  data_quality: string;
  sources?: { title: string; url: string }[];
};
type Data = {
  trainingPlan?: {
    as_of_date: string;
    rationale: string;
    entries: { date: string; name: string; detail: string }[];
  };
  records: RecordRow[];
  nutritionAnalysis: RecordRow[];
  watchRecords: RecordRow[];
  dietAdvice: DietAdvice[];
  photos: Photo[];
  journey: JourneyEntry[];
};
const short = (s: string) => s.slice(5).replace('-', '.');
const num = (v: string | undefined) => (v ? Number(v) : null);
const show = (v: string | undefined) => v || '未记录';
const photoUrl = (folder: string, file: string) =>
  `/progress_photos/${encodeURIComponent(folder)}/${encodeURIComponent(file)}`;
const meals = [
  ['pre_run_kcal', '跑前', '训练前补给'],
  ['breakfast_kcal', '早餐', '一天的开始'],
  ['lunch_kcal', '午餐', '主要正餐'],
  ['snack_kcal', '加餐 / 饮料', '零食与含热量饮品'],
  ['dinner_kcal', '晚餐', '晚间正餐'],
];
const budget: Record<string, number> = Object.fromEntries(
  Array.from({ length: 14 }, (_, i) => [`D${i + 1}`, 2000]),
);
const mealPhotoLabel = (file: string) =>
  file.startsWith('meal_breakfast')
    ? '早餐'
    : file.startsWith('meal_lunch')
      ? '午餐'
      : '晚餐';
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
    [period, setPeriod] = useState<'day' | 'week'>('day'),
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
    nutritionRows = data?.nutritionAnalysis || [],
    watchRecords = data?.watchRecords || [],
    mornings = records.filter((r) => r.weigh_time === 'morning' && r.weight_kg),
    latest = mornings.at(-1),
    baseline = mornings[0],
    waistRecords = records.filter((r) => r.waist_cm),
    latestWaist = waistRecords.at(-1),
    baselineWaist = waistRecords[0],
    selected = records.find((r) => r.date === date),
    selectedNutrition = nutritionRows.find((r) => r.date === date),
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
  const today = '2025-01-16'; // Fixed clock for synthetic demo data.
  const todayPlan = data?.trainingPlan?.entries.find((p) => p.date === today),
    elapsed = Math.max(
      1,
      Math.min(
        28,
        Math.floor((Date.parse(today) - Date.parse('2025-01-06')) / 86400000) +
          1,
      ),
    );
  const currentKcal = num(selected?.calories_kcal),
    protein = num(selected?.protein_g),
    planned = budget[selected?.menu_day || ''] ?? 2000;
  const macroWeightRecord = mornings.filter((r) => r.date <= date).at(-1),
    macroWeight = num(macroWeightRecord?.weight_kg),
    carbs = num(selectedNutrition?.carbs_g),
    macroProtein = num(selectedNutrition?.protein_g) ?? protein,
    fat = num(selectedNutrition?.fat_g),
    advice = (data?.dietAdvice || [])
      .filter(
        (entry) =>
          entry.as_of_date <=
          (period === 'week' ? weekRange(date || today)[1] : date),
      )
      .at(-1);
  const [weekStart, weekEnd] = weekRange(date || today);
  const inPeriod = (r: RecordRow) =>
    period === 'day'
      ? r.date === date
      : r.date >= weekStart && r.date <= weekEnd;
  const selectableDates = [
    ...new Set([...days.map((r) => r.date), date].filter(Boolean)),
  ].sort();
  const periodRecords = records.filter(inPeriod);
  const periodWorkouts = watchRecords.filter(
    (r) => r.entry_type === 'workout' && inPeriod(r),
  );
  const periodLabel =
    period === 'day' ? short(date) : `${short(weekStart)}–${short(weekEnd)}`;
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
            <LockKeyhole size={14} /> 私人面板
          </span>
          <button className="refresh" onClick={refresh} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            <span>{loading ? '读取中' : '刷新记录'}</span>
          </button>
        </div>
      </header>
      <div className="page-heading">
        <div>
          <p className="eyebrow">2025.01.06 / 02.02 · 虚构演示</p>
          <h1>我的减重进度</h1>
        </div>
        <div className="period">
          <span>
            计划第 <b>{elapsed}</b> 天
          </span>
          <span>
            共 28 天 ·{' '}
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
                  <span>冲刺目标</span>
                  <strong>
                    {target} <small>kg</small>
                  </strong>
                </div>
                <div className="target-percent">
                  {progress.toFixed(1)}
                  <small>%</small>
                </div>
              </div>
              <Progress
                value={progress}
                aria-label="从晨起基线到冲刺目标的进度"
              />
              <p className="caption">
                按晨重基线计算 · 所有目标和记录均为虚构示例
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
              <strong>{todayPlan ? '今日建议 · 待执行' : '记录与建议'}</strong>
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
          <div className="period-controls">
            <div className="period-switch" role="group" aria-label="统计周期">
              <button
                aria-pressed={period === 'day'}
                onClick={() => setPeriod('day')}
              >
                日
              </button>
              <button
                aria-pressed={period === 'week'}
                onClick={() => setPeriod('week')}
              >
                周
              </button>
            </div>
            <Picker
              value={period === 'day' ? date : weekStart}
              onChange={setDate}
              items={
                period === 'day'
                  ? selectableDates.map((d) => ({ value: d, label: short(d) }))
                  : [...new Set(days.map((r) => weekRange(r.date)[0]))].map(
                      (d) => ({
                        value: d,
                        label: `${short(d)}–${short(weekRange(d)[1])}`,
                      }),
                    )
              }
              label={period === 'day' ? '选择统计日期' : '选择统计周'}
            />
            <span className="muted">
              {period === 'week'
                ? '自然周 · 周一至周日 · 缺失不计零'
                : '饮食与运动使用同一日期'}
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
              {renderDietAdvice()}
              <section className="panel menu-notes">
                <div className="section-head">
                  <h2>七天食谱与执行计划</h2>
                  <Utensils size={19} />
                </div>
                <p>
                  每日预算为虚构示例 2000
                  kcal。食物照片和未称量餐食均按估算记录；未记录的数值不视为零。
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
              {renderWatchSync()}
              <section className="panel recovery">
                <h2>恢复记录</h2>
                <div className="recovery-grid">
                  {days.filter(inPeriod).map((r) => (
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
              <LockKeyhole size={13} /> 私人健康记录
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
            <p>把聊天里零散但重要的念头，收进这段路的叙事里。</p>
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
    if (period === 'week') return renderWeeklyNutrition();
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
            items={selectableDates.map((d) => ({
              value: d,
              label:
                short(d) +
                (days.find((r) => r.date === d)?.menu_day
                  ? ' · ' + days.find((r) => r.date === d)?.menu_day
                  : ' · 未记录'),
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
              : currentKcal < 1200
                ? '请先确认当日记录是否完整'
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
            {macroProtein ?? '--'} <small>/ 120 g 示例目标</small>
          </strong>
        </div>
        <Progress
          value={
            macroProtein != null ? Math.min(100, (macroProtein / 120) * 100) : 0
          }
          aria-label="蛋白质目标进度"
        />
        <p className="caption">
          示例目标仅用于演示，不代表个人营养建议 ·{' '}
          {selected?.notes.includes('partial-day')
            ? '当日记录待最终确认'
            : selected?.notes.includes('day closed')
              ? '当日已结算'
              : '待确认结算状态'}
        </p>
        {full && (
          <div className="macro-analysis">
            <div className="macro-heading">
              <div>
                <p className="section-kicker">营养素重量</p>
                <h3>全天汇总与每公斤体重</h3>
              </div>
              <span>
                {macroWeight
                  ? `按 ${macroWeight.toFixed(2)} kg 计算`
                  : '缺少可用晨重'}
              </span>
            </div>
            <div className="macro-grid">
              {[
                ['碳水化合物', carbs],
                ['蛋白质', macroProtein],
                ['脂肪', fat],
              ].map(([label, value]) => {
                const amount = typeof value === 'number' ? value : null;
                return (
                  <div className="macro-card" key={String(label)}>
                    <span>{label}</span>
                    <strong>
                      {amount == null ? '--' : amount.toFixed(0)}
                      <small>{amount == null ? '' : ' g'}</small>
                    </strong>
                    <p>
                      {amount != null && macroWeight
                        ? (amount / macroWeight).toFixed(2) + ' g/kg'
                        : '-- g/kg'}
                    </p>
                  </div>
                );
              })}
            </div>
            <p className="macro-source">
              {selectedNutrition?.estimate_status === 'low_confidence'
                ? '低置信度估算：存在成分不明的餐食。'
                : selectedNutrition?.estimate_status === 'estimated'
                  ? '根据已记录食物、份量和标签估算。'
                  : selectedNutrition
                    ? '按已确认营养数据计算。'
                    : '该日尚未完成宏量营养素核算。'}{' '}
              每公斤数值使用所选日期当日或此前最近一次晨重；空值不会按 0 处理。
            </p>
          </div>
        )}
      </section>
    );
  }
  function renderWeeklyNutrition() {
    const calories = metric(periodRecords, 'calories_kcal');
    const proteinStats = metric(periodRecords, 'protein_g');
    const weight = metric(
      periodRecords.filter((r) => r.weigh_time === 'morning'),
      'weight_kg',
    );
    const closed = periodRecords.filter((r) =>
      r.notes?.includes('day closed'),
    ).length;
    return (
      <section className="panel nutrition full">
        <div className="section-head">
          <h2>
            <Utensils size={19} /> 一周饮食与体重
          </h2>
          <span>{periodLabel}</span>
        </div>
        <div className="weekly-grid">
          {[
            [
              '日均摄入',
              calories.mean?.toFixed(0) ?? '--',
              'kcal',
              `${calories.count}/7 天有记录`,
            ],
            [
              '日均蛋白质',
              proteinStats.mean?.toFixed(0) ?? '--',
              'g',
              `${proteinStats.count}/7 天有记录`,
            ],
            [
              '平均晨重',
              weight.mean?.toFixed(2) ?? '--',
              'kg',
              `${weight.count}/7 天有晨重`,
            ],
            [
              '已记录摄入合计',
              calories.count ? calories.total.toFixed(0) : '--',
              'kcal',
              `${closed} 天已结算 · 其余可能不完整`,
            ],
          ].map(([label, value, unit, note]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>
                {value}
                <small> {unit}</small>
              </strong>
              <p>{note}</p>
            </div>
          ))}
        </div>
        <p className="caption">
          均值仅按各项有数据的日期计算；包含尚未结算的估算，不代表完整周摄入或热量缺口。
        </p>
        <div className="week-table-wrap">
          <table className="week-table">
            <thead>
              <tr>
                <th>日期</th>
                <th>摄入 kcal</th>
                <th>蛋白质 g</th>
                <th>晨重 kg</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 7 }, (_, i) => {
                const d = new Date(Date.parse(weekStart) + i * 86400000)
                  .toISOString()
                  .slice(0, 10);
                const r = periodRecords.find((r) => r.date === d);
                return (
                  <tr key={d}>
                    <td>
                      <button
                        onClick={() => {
                          setDate(d);
                          setPeriod('day');
                        }}
                      >
                        {short(d)}
                      </button>
                    </td>
                    <td>{r?.calories_kcal || '—'}</td>
                    <td>{r?.protein_g || '—'}</td>
                    <td>
                      {r?.weigh_time === 'morning' ? r.weight_kg || '—' : '—'}
                    </td>
                    <td>
                      {d > today
                        ? '尚未到来'
                        : !r?.calories_kcal
                          ? '未记录'
                          : r.notes?.includes('day closed')
                            ? '已结算'
                            : '待确认'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    );
  }
  function renderExercise({ full = false }: { full?: boolean }) {
    const duration = metric(periodWorkouts, 'duration_min');
    const workoutName = (name: string) =>
      ({
        Dance: '舞蹈',
        'Functional Strength Training': '功能性力量训练',
        'Pool Swim': '泳池游泳',
        'Outdoor Run': '户外跑步',
      })[name] || name;
    const plan = data?.trainingPlan;
    const latestWatchDate = watchRecords.at(-1)?.date;
    return (
      <section className={'panel exercise ' + (full ? 'full' : '')}>
        <div className="section-head">
          <h2>
            <Dumbbell size={19} /> 实际运动
          </h2>
          <span>{periodLabel}</span>
        </div>
        <div className="exercise-totals">
          <div>
            <Activity size={19} />
            <strong>
              {periodWorkouts.length || '--'}
              <small>次</small>
            </strong>
            <span>Watch 已记录活动</span>
          </div>
          <div>
            <Footprints size={19} />
            <strong>
              {duration.count ? duration.total : '--'}
              <small>min</small>
            </strong>
            <span>
              已记录时长
              {duration.count < periodWorkouts.length ? ' · 部分缺失' : ''}
            </span>
          </div>
        </div>
        {!periodWorkouts.length && (
          <p className="watch-empty">
            这个{period === 'day' ? '日期' : '周'}还没有 Watch
            训练记录。没有截图不代表没有运动。
          </p>
        )}
        <div className="schedule">
          {periodWorkouts.map((r, i) => (
            <div className="schedule-row" key={`${r.date}-${i}`}>
              <div className="schedule-date">
                <b>{short(r.date)}</b>
                <span>{r.start_time || '时间未显示'}</span>
              </div>
              <div className="schedule-name">
                <strong>{workoutName(r.workout_type)}</strong>
                <span>
                  {r.duration_min ? `${r.duration_min} 分钟` : '时长未显示'}
                  {r.distance_km
                    ? ` · ${r.distance_km} km`
                    : r.distance_m
                      ? ` · ${r.distance_m} m`
                      : ''}
                  {r.avg_hr_bpm ? ` · 平均心率 ${r.avg_hr_bpm}` : ''}
                  {r.workout_type === 'Dance' ? ' · 娱乐 / 恢复参考' : ''}
                </span>
              </div>
              <span className="schedule-state done">已记录</span>
            </div>
          ))}
        </div>
        <p className="caption">
          仅汇总截图已确认的活动；计划和手填历史记录不混入。舞蹈单列为娱乐活动，不计正式训练配额；手表热量不直接换成饮食额度。
        </p>
        {plan && (
          <details className="future-plan" open={full}>
            <summary>接下来怎么练 · 可调整</summary>
            <p className="caption">
              依据截至 {short(plan.as_of_date)} 的截图与恢复记录：
              {plan.rationale}
            </p>
            {latestWatchDate && latestWatchDate > plan.as_of_date && (
              <p className="caption">已有较新截图，以下安排待重新评估。</p>
            )}
            <div className="schedule">
              {plan.entries
                .filter((p) => p.date >= today)
                .map((p) => (
                  <div className="schedule-row" key={p.date}>
                    <div className="schedule-date">
                      <b>{short(p.date)}</b>
                    </div>
                    <div className="schedule-name">
                      <strong>{p.name}</strong>
                      <span>{p.detail}</span>
                    </div>
                    <span className="schedule-state">建议</span>
                  </div>
                ))}
            </div>
            <p className="caption">
              收到新截图后更新建议；不会把未执行的安排记成完成，也不补做漏掉的训练。
            </p>
          </details>
        )}
      </section>
    );
  }

  function renderDietAdvice() {
    if (!advice) {
      return (
        <section className="panel diet-advice">
          <div className="section-head">
            <h2>
              <MessageCircle size={19} /> 每日饮食建议
            </h2>
          </div>
          <p className="watch-empty">
            所选日期暂无已保存的建议。收到饮食记录后，会结合近期趋势更新。
          </p>
        </section>
      );
    }
    return (
      <section
        className="panel diet-advice"
        aria-labelledby="diet-advice-title"
      >
        <div className="advice-header">
          <div>
            <p className="section-kicker">营养与恢复 · 循证建议</p>
            <h2 id="diet-advice-title">{advice.title}</h2>
          </div>
          <span>
            截至该日的 {advice.window_days} 日窗口 · 更新至{' '}
            {short(advice.as_of_date)}
          </span>
        </div>
        <p className="advice-summary">{advice.summary}</p>
        <div className="advice-columns">
          <div>
            <h3>最近体现</h3>
            <ul>
              {advice.observations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3>接下来怎么吃</h3>
            <ol>
              {advice.actions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </div>
        </div>
        <div className="advice-focus">
          <strong>下一天唯一重点</strong>
          <p>{advice.next_day_focus}</p>
        </div>
        <p className="advice-quality">数据口径：{advice.data_quality}</p>
        <div className="advice-sources">
          参考依据：
          {advice.sources?.map((source) => (
            <a
              key={source.url}
              href={source.url}
              target="_blank"
              rel="noreferrer"
            >
              {source.title}
            </a>
          ))}
        </div>
      </section>
    );
  }

  function renderWatchSync() {
    const latestSleep = [...watchRecords]
      .filter((r) => r.entry_type === 'sleep' && inPeriod(r))
      .at(-1);
    const workouts = [...watchRecords]
      .filter((r) => r.entry_type === 'workout' && inPeriod(r))
      .reverse();
    return (
      <section className="panel watch-sync" aria-labelledby="watch-sync-title">
        <div className="section-head">
          <h2 id="watch-sync-title">
            <Moon size={19} /> Apple Watch 数据
          </h2>
          <span className="muted">{periodLabel} · 截图明细</span>
        </div>
        {!latestSleep && workouts.length === 0 ? (
          <div className="watch-empty">
            <strong>所选期间尚未收到 Watch 明细。</strong>
            <p>
              发两张截图即可：健康 App 的“睡眠”日详情，以及健身 App
              的“体能训练”详情。我会录入时长、睡眠阶段、距离和心率；活动热量不用于增加饮食额度。
            </p>
          </div>
        ) : (
          <div className="watch-grid">
            {latestSleep && (
              <article className="watch-entry">
                <span>{short(latestSleep.date)} · 睡眠</span>
                <strong>{show(latestSleep.sleep_total_h)} h</strong>
                <p>
                  核心 {show(latestSleep.sleep_core_h)} h · 深睡{' '}
                  {show(latestSleep.sleep_deep_h)} h · REM{' '}
                  {show(latestSleep.sleep_rem_h)} h
                </p>
                <p>
                  睡眠评分 {show(latestSleep.sleep_score)}
                  {latestSleep.sleep_rating
                    ? `（${latestSleep.sleep_rating}）`
                    : ''}{' '}
                  · 睡眠心率 {show(latestSleep.sleep_hr_min_bpm)}–
                  {show(latestSleep.sleep_hr_max_bpm)} bpm · 呼吸{' '}
                  {show(latestSleep.respiratory_min_brpm)}–
                  {show(latestSleep.respiratory_max_brpm)} 次/分
                </p>
              </article>
            )}
            {workouts.map((r, index) => (
              <article
                className="watch-entry"
                key={`${r.date}-${r.start_time}-${index}`}
              >
                <span>
                  {short(r.date)} · {show(r.workout_type)}
                </span>
                <strong>
                  {show(r.duration_min)} <small>min</small>
                </strong>
                <p>
                  {r.distance_km ? `${r.distance_km} km · ` : ''}
                  {r.distance_m ? `${r.distance_m} m · ` : ''}
                  平均心率 {show(r.avg_hr_bpm)} bpm
                </p>
              </article>
            ))}
          </div>
        )}
        <p className="caption">
          Apple Watch 会先同步到 iPhone 健康
          App；本页只展示你主动交给本项目的摘要，不会直接读取手机健康数据库。
        </p>
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
                  file = entry?.files.find((candidate) =>
                    [angle + '.jpeg', angle + '.jpg'].includes(
                      candidate.toLowerCase(),
                    ),
                  );
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
                    {file ? (
                      <a
                        href={photoUrl(folder, file)}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={'查看' + entry?.date + '体型照片原图'}
                      >
                        <img
                          src={photoUrl(folder, file)}
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
                  alt={p.date + ' ' + mealPhotoLabel(p.file)}
                  loading="lazy"
                />
              </a>
              <figcaption>
                {short(p.date)} · {mealPhotoLabel(p.file)}
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
