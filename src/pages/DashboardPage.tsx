import { useState } from 'react';
import { Card, Table, Badge, EmptyState } from '../components/ui';
import { formatPct, type PortfolioData } from '../lib/dataStore';
import { netDepositFromTransactions } from '../engine/calc';
import { useSettings } from '../lib/settings';

const CATEGORY_LABELS: Record<string, string> = {
  STOCK: 'Stock',
  CRYPTO: 'Crypto',
  ETF: 'ETF',
  FUND: 'DCDS',
  BANK_DEPOSIT: 'Bank',
  CASH: 'Cash',
};

const CATEGORY_COLORS: Record<string, string> = {
  STOCK: '#8b5cf6',        // Tím
  CRYPTO: '#f59e0b',       // Vàng / cam
  ETF: '#94a3b8',          // Xám / bạc
  FUND: '#22c55e',         // Xanh lá - DCDS
  BANK_DEPOSIT: '#3b82f6', // Xanh dương - Bank
  CASH: '#64748b',         // Xám xanh - Cash
};

const DONUT_RADIUS = 88;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

export function DashboardPage({ data }: { data: PortfolioData }) {
  const { summary, transactions, targetAllocation } = data;
  const { formatMoney } = useSettings();

  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  /*
   * Giữ thứ tự giống giao diện mẫu:
   * Stock → Crypto → ETF → DCDS → Bank → Cash
   */
  const categoryKeys = [
    'FUND',          // DCDS
    'ETF',           // ETF
    'STOCK',         // Stock
    'CRYPTO',        // Crypto
    'BANK_DEPOSIT',  // Bank
    'CASH',          // Cash
  ];

  const allocData = categoryKeys
    .map((key) => ({
      key,
      label: CATEGORY_LABELS[key],
      pct: summary.allocation[key] || 0,
      value: summary.categoryBreakdown[key] || 0,
      color: CATEGORY_COLORS[key],
    }))
    .filter((item) => item.value > 0 || item.pct > 0);

  /*
   * Tổng tiền đã nạp = Tổng Deposit - Tổng Withdraw.
   *
   * Không bao gồm:
   * - Realized Profit
   * - Unrealized Profit
   * - Interest
   * - Dividends
   * - Asset Appreciation
   * - Trade T+ Profit
   */
  const netDeposits = netDepositFromTransactions(transactions);

  const recentTxs = [...transactions]
    .sort((a, b) =>
      b.transaction_date.localeCompare(a.transaction_date)
    )
    .slice(0, 8);

  /*
   * Tính vị trí bắt đầu của từng segment.
   * Dùng cho tooltip/mũi tên khi hover.
   */
  let cumulativePct = 0;

  const chartData = allocData.map((item) => {
    const startPct = cumulativePct;
    const endPct = cumulativePct + item.pct;

    cumulativePct = endPct;

    return {
      ...item,
      startPct,
      endPct,
      middlePct: startPct + item.pct / 2,
    };
  });

  const hoveredItem = hoveredCategory
    ? chartData.find((item) => item.key === hoveredCategory) || null
    : null;

  /*
   * Tính vị trí tooltip theo vị trí trung tâm của segment đang hover.
   */
  const getTooltipPosition = (middlePct: number) => {
  const angle =
    (middlePct / 100) * Math.PI * 2 - Math.PI / 2;

  // Điểm mũi tên nằm ngay ngoài mép donut
  const pointRadius = 112;

  // Tooltip nằm xa hơn, không che biểu đồ
  const tooltipRadius = 165;

  const pointX =
    100 + Math.cos(angle) * pointRadius;

  const pointY =
    100 + Math.sin(angle) * pointRadius;

  const tooltipX =
    100 + Math.cos(angle) * tooltipRadius;

  const tooltipY =
    100 + Math.sin(angle) * tooltipRadius;

  return {
    pointX,
    pointY,
    tooltipX,
    tooltipY,
  };
};
  return (
    <div className="min-w-0 space-y-5 sm:space-y-6">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex items-start justify-between gap-4">
  <div>
    <h1 className="text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">
      Dashboard
    </h1>

    <p className="mt-1 text-sm text-slate-400">
      Tổng quan toàn bộ danh mục đầu tư
    </p>
  </div>

  <div className="shrink-0 text-right">
    <p className="text-xs font-medium text-slate-400">
      Cash
    </p>

    <p className="mt-1 text-base font-bold text-slate-100 sm:text-lg">
      {formatMoney(summary.totalCash)}
    </p>
  </div>
</div>


            {/* =====================================================
          SUMMARY CARDS
      ====================================================== */}

      {/*
       * Tổng tiền đã nạp = Deposit - Withdraw
       * Đây là VỐN GỐC của người dùng.
       */}
      {(() => {
        const netDeposits = netDepositFromTransactions(transactions);

        /*
         * Tổng tài sản hiện tại:
         * Giá trị toàn bộ tài sản hiện tại sau khi đã phản ánh
         * lãi/lỗ, tăng giảm giá trị tài sản.
         */
        const currentTotalAsset = summary.totalAsset;

        /*
         * Tổng Lãi/Lỗ so với vốn đã nạp:
         *
         * Tổng tài sản hiện tại - Tổng tiền đã nạp
         */
        const totalPnLvsDeposits =
          currentTotalAsset - netDeposits;

        /*
         * Tỷ suất Lãi/Lỗ trên vốn gốc
         */
        const pnlPct =
          netDeposits !== 0
            ? (totalPnLvsDeposits / netDeposits) * 100
            : 0;

        return (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:gap-4">

            {/* Tổng tài sản hiện tại */}
            <DashboardStatCard
              title="Tổng tài sản hiện tại"
              value={formatMoney(currentTotalAsset)}
              subtitle="Sau khi tính lãi/lỗ"
            />

            {/* Tổng tiền đã nạp */}
            <DashboardStatCard
              title="Tổng tiền đã nạp"
              value={formatMoney(netDeposits)}
              subtitle="Vốn gốc"
            />

            {/* Tổng Lãi/Lỗ */}
            <DashboardStatCard
              title="Tổng Lãi/Lỗ"
              value={formatMoney(totalPnLvsDeposits)}
              subtitle={`${formatPct(pnlPct)} so với vốn gốc`}
              subtitleClass={
                totalPnLvsDeposits < 0
                  ? 'text-rose-500'
                  : 'text-emerald-400'
              }
            />

          </div>
        );
      })()}


      {/* =====================================================
          ALLOCATION + CATEGORY SUMMARY
      ====================================================== */}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.05fr_0.95fr]">


        {/* =================================================
            PHÂN BỔ TÀI SẢN
        ================================================== */}

        <Card
          className="
            !rounded-2xl
            !border-slate-700/90
            !bg-[#17243d]
            !p-5
            shadow-[0_8px_24px_rgba(0,0,0,0.16)]
            sm:!p-6
          "
        >

          <h2 className="mb-5 text-sm font-semibold text-slate-100 sm:text-base">
            Phân bổ tài sản
          </h2>


          <div
            className="
              grid
              grid-cols-1
              items-center
              gap-5
              md:grid-cols-[minmax(250px,1fr)_minmax(220px,0.9fr)]
            "
          >

            {/* =============================================
                DONUT CHART
            ============================================== */}

            <div className="relative flex min-h-[310px] items-center justify-center pt-8 pb-2">

              <svg
                 width="330"
  height="330"
  viewBox="-60 -60 320 320"
                className="
  h-[300px]
  w-[300px]
  max-w-full
  overflow-visible
  sm:h-[330px]
  sm:w-[330px]
"
                role="img"
                aria-label="Biểu đồ phân bổ tài sản"
              >

                {/* Background ring */}

                <circle
  cx="100"
  cy="100"
  r="64"
  fill="#17243d"
/>


                {/* =========================================
                    DONUT SEGMENTS
                ========================================== */}

                {chartData.map((item) => {
                  const dash =
                    (item.pct / 100) *
                    DONUT_CIRCUMFERENCE;

                  const offset =
                    -(item.startPct *
                      DONUT_CIRCUMFERENCE) /
                    100;

                  const active =
                    hoveredCategory === item.key;

                  const hasHover =
                    hoveredCategory !== null;

                  return (
                    <circle
                      key={item.key}
                      cx="100"
                      cy="100"
                      r={DONUT_RADIUS}
                      fill="none"
                      stroke={item.color}
                  strokeWidth={
  active
    ? 58
    : hasHover
      ? 50
      : 54
}
                      strokeDasharray={`${dash} ${
                        DONUT_CIRCUMFERENCE - dash
                      }`}
                      strokeDashoffset={offset}
                      transform="rotate(-90 100 100)"
                      className="
                        cursor-pointer
                        transition-all
                        duration-200
                      "
                      style={{
                        opacity:
                          hasHover && !active
                            ? 0.42
                            : 1,

                        filter: active
                          ? `drop-shadow(0 0 5px ${item.color})`
                          : 'none',
                      }}
                      onMouseEnter={() =>
                        setHoveredCategory(item.key)
                      }
                      onMouseLeave={() =>
                        setHoveredCategory(null)
                      }
                    />
                  );
                })}


                {/* =========================================
                    CENTER OF DONUT
                ========================================== */}

   <circle
  cx="100"
  cy="100"
  r="64"
  fill="#17243d"
  className="pointer-events-none"
/>

<text
  x="100"
  y="94"
  textAnchor="middle"
  className="pointer-events-none fill-slate-400 text-[12px]"
>
  Tổng
</text>

<text
  x="100"
  y="114"
  textAnchor="middle"
  className="pointer-events-none fill-slate-100 text-[14px] font-bold"
>
  {formatMoney(summary.totalAsset)}
</text>

                {/* =========================================
                    HOVER TOOLTIP
                ========================================== */}

                {hoveredItem &&
  (() => {
    const position = getTooltipPosition(
      hoveredItem.middlePct
    );

    const direction =
      position.tooltipX >= 100 ? 1 : -1;

    const boxWidth = 125;
    const boxHeight = 42;

    /*
     * Đẩy tooltip ra xa donut.
     * Tooltip không nằm trên vòng biểu đồ.
     */
   const tooltipX = position.tooltipX;
const tooltipY = position.tooltipY;

    /*
     * Giới hạn tooltip trong SVG để không bị cắt.
     */
  const safeTooltipX = tooltipX;
const safeTooltipY = tooltipY;

    const boxX =
      safeTooltipX -
      boxWidth / 2;

    const boxY =
      safeTooltipY -
      boxHeight / 2;

    /*
     * Điểm cuối của đường nối.
     * Luôn nằm bên ngoài donut.
     */
    const lineEndX =
      safeTooltipX -
      direction *
        (boxWidth / 2);

    return (
      <g className="pointer-events-none">

        {/* Đường nối từ biểu đồ tới tooltip */}
        <line
          x1={position.pointX}
          y1={position.pointY}
          x2={lineEndX}
          y2={safeTooltipY}
          stroke={hoveredItem.color}
          strokeWidth="1.5"
        />

        {/* Mũi tên */}
        <polygon
          points={
            direction > 0
              ? `
                ${position.pointX},${position.pointY}
                ${position.pointX - 6},${position.pointY - 3}
                ${position.pointX - 6},${position.pointY + 3}
              `
              : `
                ${position.pointX},${position.pointY}
                ${position.pointX + 6},${position.pointY - 3}
                ${position.pointX + 6},${position.pointY + 3}
              `
          }
          fill={hoveredItem.color}
        />

        {/* Tooltip */}
        <rect
  x={boxX}
  y={boxY}
  width={boxWidth}
  height={boxHeight}
  rx="6"
  fill="#0f1b30"
  stroke={hoveredItem.color}
  strokeWidth="1"
/>

        {/* Tên danh mục */}
        <text
  x={safeTooltipX}
  y={safeTooltipY - 7}
  textAnchor="middle"
  className="fill-slate-400 text-[12px]"
>
  {hoveredItem.label}
</text>

        {/* Giá trị */}
        <text
  x={safeTooltipX}
  y={safeTooltipY + 10}
  textAnchor="middle"
  className="fill-slate-100 text-[12px] font-bold"
>
  {formatMoney(hoveredItem.value)}
</text>

      </g>
    );
  })()}

              </svg>

            </div>


            {/* =============================================
                LEGEND
            ============================================== */}

            <div className="space-y-2">

              {chartData.map((item) => {
                const target =
                  targetAllocation[
                    item.key as keyof typeof targetAllocation
                  ];

                const active =
                  hoveredCategory === item.key;

                return (
                  <div
                    key={item.key}
                    className={`
                      flex
                      cursor-pointer
                      items-center
                      justify-between
                      gap-3
                      rounded-lg
                      px-2
                      py-1.5
                      transition-all
                      duration-200
                      ${
                        active
                          ? 'bg-slate-800/80'
                          : ''
                      }
                    `}
                    onMouseEnter={() =>
                      setHoveredCategory(item.key)
                    }
                    onMouseLeave={() =>
                      setHoveredCategory(null)
                    }
                  >

                    <div className="flex min-w-0 items-center gap-2">

                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            item.color,
                        }}
                      />

                      <span className="truncate text-sm text-slate-300">
                        {item.label}
                      </span>

                    </div>


                    <div className="flex shrink-0 items-center gap-2">

                      <span className="text-sm font-semibold text-slate-100">
                        {item.pct.toFixed(1)}%
                      </span>

                      {target !== undefined && (
                        <span
                          className="
                            hidden
                            rounded
                            bg-amber-500/15
                            px-1.5
                            py-1
                            text-[10px]
                            font-medium
                            text-amber-400
                            sm:inline-flex
                          "
                        >
                          Mục tiêu: {target}%
                        </span>
                      )}

                    </div>

                  </div>
                );
              })}

            </div>

          </div>

        </Card>


        {/* =================================================
            TỔNG HỢP THEO NHÓM
        ================================================== */}

        <Card
          className="
            !rounded-2xl
            !border-slate-700/90
            !bg-[#17243d]
            !p-5
            shadow-[0_8px_24px_rgba(0,0,0,0.16)]
            sm:!p-6
          "
        >

          <h2 className="mb-5 text-sm font-semibold text-slate-100 sm:text-base">
            Tổng hợp theo nhóm
          </h2>


          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

            {chartData
              .filter(
                (item) => item.key !== 'CASH'
              )
              .map((item) => (

                <div
                  key={item.key}
                  className="
                    rounded-xl
                    border
                    border-slate-700
                    bg-[#192741]
                    p-4
                    transition-colors
                    hover:border-slate-600
                  "
                >

                  <div className="flex items-center gap-2">

                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor:
                          item.color,
                      }}
                    />

                    <span className="text-xs text-slate-400 sm:text-sm">
                      {item.label}
                    </span>

                  </div>


                  <p className="mt-2 text-base font-bold text-slate-100 sm:text-lg">
                    {formatMoney(item.value)}
                  </p>


                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {item.pct.toFixed(1)}% danh mục
                  </p>

                </div>

              ))}

          </div>

        </Card>

      </div>


      {/* =====================================================
          GIAO DỊCH GẦN ĐÂY
      ====================================================== */}

      <Card
        className="
          !rounded-2xl
          !border-slate-700/90
          !bg-[#17243d]
          !p-4
          shadow-[0_8px_24px_rgba(0,0,0,0.16)]
          sm:!p-5
        "
      >

        <h2 className="mb-4 text-sm font-semibold text-slate-100 sm:text-base">
          Giao dịch gần đây
        </h2>


        {recentTxs.length === 0 ? (
          <EmptyState message="Chưa có giao dịch nào" />
        ) : (
          <div className="overflow-x-auto">

            <Table
              columns={[
                {
                  key: 'date',
                  label: 'Ngày',
                },
                {
                  key: 'type',
                  label: 'Loại',
                },
                {
                  key: 'asset',
                  label: 'Tài sản',
                },
                {
                  key: 'amount',
                  label: 'Giá trị',
                  align: 'right',
                },
                {
                  key: 'status',
                  label: 'Trạng thái',
                  align: 'center',
                },
              ]}
              rows={recentTxs}
              renderRow={(tx) => {

                const asset =
                  data.assets.find(
                    (a) => a.id === tx.asset_id
                  );

                return {
                  date: tx.transaction_date,

                  type: (
                    <Badge
                      variant={
                        tx.transaction_type ===
                        'BUY'
                          ? 'info'
                          : tx.transaction_type ===
                              'SELL'
                            ? 'warning'
                            : tx.transaction_type ===
                                'DEPOSIT'
                              ? 'success'
                              : 'default'
                      }
                    >
                      {tx.transaction_type}
                    </Badge>
                  ),

                  asset:
                    asset?.symbol || 'Cash',

                  amount: (
                    <span className="whitespace-nowrap text-slate-200">
                      {formatMoney(tx.amount)}
                    </span>
                  ),

                  status: (
                    <Badge
                      variant={
                        tx.status ===
                        'COMPLETED'
                          ? 'success'
                          : 'warning'
                      }
                    >
                      {tx.status === 'COMPLETED'
                        ? 'Hoàn tất'
                        : 'Chờ'}
                    </Badge>
                  ),
                };
              }}
            />

          </div>
        )}

      </Card>

    </div>
  );
}


/* ============================================================
   SUMMARY CARD
============================================================ */

function DashboardStatCard({
  title,
  value,
  subtitle,
  subtitleClass = 'text-slate-500',
}: {
  title: string;
  value: string;
  subtitle?: string;
  subtitleClass?: string;
}) {

  return (
    <div
      className="
        min-w-0
        rounded-xl
        border
        border-slate-700/90
        bg-[#17243d]
        px-4
        py-4
        shadow-[0_6px_18px_rgba(0,0,0,0.14)]
        sm:px-5
        sm:py-5
      "
    >

      <p className="text-xs font-medium text-slate-400 sm:text-sm">
        {title}
      </p>


      <p
        className="
          mt-2
          truncate
          text-lg
          font-bold
          tracking-tight
          text-slate-100
          sm:text-xl
        "
      >
        {value}
      </p>


      {subtitle && (
        <p
          className={`
            mt-1
            text-[11px]
            font-medium
            sm:text-xs
            ${subtitleClass}
          `}
        >
          {subtitle}
        </p>
      )}

    </div>
  );
}