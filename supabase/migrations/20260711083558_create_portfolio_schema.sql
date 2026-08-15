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
  STOCK: '#3b82f6',
  CRYPTO: '#f59e0b',
  ETF: '#10b981',
  FUND: '#8b5cf6',
  BANK_DEPOSIT: '#ec4899',
  CASH: '#64748b',
};

const DONUT_RADIUS = 80;
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
    'STOCK',
    'CRYPTO',
    'ETF',
    'FUND',
    'BANK_DEPOSIT',
    'CASH',
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
    const angle = (middlePct / 100) * Math.PI * 2 - Math.PI / 2;

    const pointRadius = 82;
    const tooltipRadius = 116;

    const pointX = 100 + Math.cos(angle) * pointRadius;
    const pointY = 100 + Math.sin(angle) * pointRadius;

    const tooltipX = 100 + Math.cos(angle) * tooltipRadius;
    const tooltipY = 100 + Math.sin(angle) * tooltipRadius;

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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            Tổng quan toàn bộ danh mục đầu tư
          </p>
        </div>
      </div>


      {/* =====================================================
          SUMMARY CARDS
      ====================================================== */}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">

        {/* Tổng tài sản */}
        <DashboardStatCard
          title="Tổng tài sản"
          value={formatMoney(summary.totalAsset)}
          subtitle={formatPct(summary.totalReturnPct)}
          subtitleClass={
            summary.totalReturnPct < 0
              ? 'text-rose-500'
              : 'text-emerald-400'
          }
        />

        {/* Cash */}
        <DashboardStatCard
          title="Cash"
          value={formatMoney(summary.totalCash)}
          subtitle={`${(
            summary.allocation.CASH || 0
          ).toFixed(1)}% tổng tài sản`}
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
          value={formatMoney(summary.totalPnL)}
          subtitle={formatPct(summary.totalReturnPct)}
          subtitleClass={
            summary.totalPnL < 0
              ? 'text-rose-500'
              : 'text-emerald-400'
          }
        />

      </div>


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

            <div className="relative flex min-h-[270px] items-center justify-center">

              <svg
                width="280"
                height="280"
                viewBox="0 0 200 200"
                className="
                  h-[250px]
                  w-[250px]
                  max-w-full
                  overflow-visible
                  sm:h-[280px]
                  sm:w-[280px]
                "
                role="img"
                aria-label="Biểu đồ phân bổ tài sản"
              >

                {/* Background ring */}

                <circle
                  cx="100"
                  cy="100"
                  r={DONUT_RADIUS}
                  fill="none"
                  stroke="#263650"
                  strokeWidth="20"
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
                          ? 25
                          : hasHover
                            ? 18
                            : 20
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
                  r="59"
                  fill="#17243d"
                  className="pointer-events-none"
                />

                <text
                  x="100"
                  y="94"
                  textAnchor="middle"
                  className="
                    pointer-events-none
                    fill-slate-400
                    text-[10px]
                  "
                >
                  Tổng
                </text>

                <text
                  x="100"
                  y="114"
                  textAnchor="middle"
                  className="
                    pointer-events-none
                    fill-slate-100
                    text-[11px]
                    font-bold
                  "
                >
                  {formatMoney(summary.totalAsset)}
                </text>


                {/* =========================================
                    HOVER TOOLTIP
                ========================================== */}

                {hoveredItem &&
                  (() => {
                    const position =
                      getTooltipPosition(
                        hoveredItem.middlePct
                      );

                    /*
                     * Giới hạn tooltip để không bị quá sát mép.
                     */
                    const tooltipX = Math.max(
                      58,
                      Math.min(
                        142,
                        position.tooltipX
                      )
                    );

                    const tooltipY = Math.max(
                      15,
                      Math.min(
                        185,
                        position.tooltipY
                      )
                    );

                    const direction =
                      tooltipX >= 100 ? 1 : -1;

                    const boxWidth = 82;
                    const boxHeight = 25;

                    const boxX =
                      tooltipX -
                      (boxWidth / 2);

                    const boxY =
                      tooltipY -
                      (boxHeight / 2);

                    /*
                     * Điểm nối từ segment → tooltip.
                     */
                    const lineEndX =
                      tooltipX -
                      direction * 39;

                    return (
                      <g className="pointer-events-none">

                        {/* Mũi tên / đường chỉ */}
                        <line
                          x1={position.pointX}
                          y1={position.pointY}
                          x2={lineEndX}
                          y2={tooltipY}
                          stroke={hoveredItem.color}
                          strokeWidth="1.5"
                        />

                        {/* Đầu mũi tên */}
                        <polygon
                          points={
                            direction > 0
                              ? `${position.pointX},${position.pointY}
                                 ${position.pointX - 5},${position.pointY - 3}
                                 ${position.pointX - 5},${position.pointY + 3}`
                              : `${position.pointX},${position.pointY}
                                 ${position.pointX + 5},${position.pointY - 3}
                                 ${position.pointX + 5},${position.pointY + 3}`
                          }
                          fill={hoveredItem.color}
                        />

                        {/* Tooltip box */}
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

                        {/* Tên nhóm */}
                        <text
                          x={tooltipX}
                          y={tooltipY - 3}
                          textAnchor="middle"
                          className="
                            fill-slate-400
                            text-[6px]
                          "
                        >
                          {hoveredItem.label}
                        </text>

                        {/* Giá trị */}
                        <text
                          x={tooltipX}
                          y={tooltipY + 7}
                          textAnchor="middle"
                          className="
                            fill-slate-100
                            text-[7px]
                            font-bold
                          "
                        >
                          {formatMoney(
                            hoveredItem.value
                          )}
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