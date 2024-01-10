"use client";

import { Fragment } from "react";
import { AxisBottom } from "@visx/axis";
import { curveStepAfter } from "@visx/curve";
import { localPoint } from "@visx/event";
import { LinearGradient, RadialGradient } from "@visx/gradient";
import { Group } from "@visx/group";
import { Pattern } from "@visx/pattern";
import { ParentSize } from "@visx/responsive";
import { scaleLinear, scaleTime } from "@visx/scale";
import { AreaClosed, Bar, Circle, LinePath } from "@visx/shape";
import { TooltipWithBounds, useTooltip } from "@visx/tooltip";
import { bisector, extent } from "d3-array";

import { Price, Public } from "@awardrobe/db";

import { useProductInfo } from "@/components/product/ProductInfoProvider";
import { formatCurrency, formatDate } from "@/utils/utils";

export type ChartPrice = {
  date: string;
  price: number;
  stock: number;
};

export type PricesChartProps = {
  prices: Public<Price>[] | null;
  augmentCurrentPrice?: boolean;
};

type VisxChartProps = {
  prices: ChartPrice[];
  width: number;
  height: number;
};

// accessors
const dateBisector = bisector<ChartPrice, Date>((d) => new Date(d.date)).left;
const dateAccessor = (d: ChartPrice) => new Date(d.date);
const priceAccessor = (d: ChartPrice) => d.price;
const stockAccessor = (d: ChartPrice) => d.stock;

export function ProductChart({ prices, augmentCurrentPrice = true }: PricesChartProps) {
  const { isPending } = useProductInfo();

  const lastPrice = prices?.at(-1);
  const chartPrices: ChartPrice[] | null =
    prices !== null && lastPrice
      ? prices
          .concat(augmentCurrentPrice ? { ...lastPrice, timestamp: new Date() } : [])
          .map((price) => ({
            date: price.timestamp.toString(),
            price: price.priceInCents,
            stock: price.inStock ? 1 : 0,
          }))
      : null;

  const overlayComponent = isPending ? (
    <div className="bg-gradient-radial from-background absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 to-transparent p-16 text-center">
      <p className="text-muted-foreground">Loading...</p>
    </div>
  ) : prices === null ? (
    <div className="bg-gradient-radial from-background absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 to-transparent p-16 text-center">
      <h2 className="text-xl font-medium">No price history</h2>
      <p className="text-muted-foreground">
        We have no data in this date range. Maybe try again later?
      </p>
    </div>
  ) : null;

  return (
    <ParentSize className="relative">
      {({ width, height }) => (
        <Fragment>
          <VisxChart prices={chartPrices ?? []} width={width} height={height} />
          {overlayComponent}
        </Fragment>
      )}
    </ParentSize>
  );
}

function VisxChart({ prices, width, height }: VisxChartProps) {
  const { tooltipData, tooltipLeft, tooltipOpen, showTooltip, hideTooltip } =
    useTooltip<ChartPrice>();

  if (width <= 0 || height <= 0) {
    return null;
  }

  const margin = { top: 0, right: 0, bottom: prices.length > 0 ? 50 : 0, left: 0 };

  // bounds
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // scales
  const timeExtent = extent(prices, dateAccessor);
  const timeScale = scaleTime<number>({
    range: [0, innerWidth],
    domain: timeExtent as [Date, Date],
    round: true,
  });
  const priceExtent = extent(prices, priceAccessor);
  const priceScale = scaleLinear<number>({
    range: [innerHeight, 0],
    domain: [0, (priceExtent[1] ?? 0) * 1.2],
  });
  const stockScale = scaleLinear<number>({
    range: [innerHeight, 0],
    domain: [0, 1],
  });

  const handleTooltip = (event: React.TouchEvent<SVGElement> | React.MouseEvent<SVGElement>) => {
    const coords = localPoint(event) ?? { x: 0, y: 0 };
    const invertedDate = timeScale.invert(coords.x - margin.left);
    const index = dateBisector(prices, invertedDate, 1);
    const price = prices[index - 1];

    if (!price) return;
    const data = {
      ...price,
      date: invertedDate.toISOString(),
    };

    showTooltip({
      tooltipLeft: coords.x,
      tooltipTop: coords.y,
      tooltipData: data,
    });
  };

  return (
    <Fragment>
      <svg width={width} height={height}>
        <Group left={margin.left} top={margin.top}>
          <RadialGradient id="grid-gradient" from="#DBDBDB" to="#4A4A4A" />
          <linearGradient id="tooltip-gradient" gradientTransform="rotate(90)">
            <stop offset="0" stopColor="black" />
            <stop offset="0.25" stopColor="white" />
            <stop offset="0.75" stopColor="white" />
            <stop offset="1" stopColor="black" />
          </linearGradient>
          <LinearGradient
            id="area-gradient"
            from="#A8FF99"
            fromOpacity={0.3}
            to="#A8FF99"
            toOpacity={0.15}
          />
          <mask id="grid-mask">
            <Bar width={innerWidth} height={innerHeight} fill="url(#grid-gradient)" />
          </mask>
          <mask id="tooltip-mask">
            <Bar
              x={margin.left}
              y={margin.top}
              width={innerWidth}
              height={innerHeight}
              fill="url(#tooltip-gradient)"
            />
          </mask>
          <mask id="chart-mask">
            <Bar width={innerWidth} height={innerHeight} fill="white" />
          </mask>
          <Pattern id="grid-pattern" width={12} height={12}>
            <Circle cx={5} cy={5} r={1.5} fill="hsl(var(--border))" />
          </Pattern>
          <Bar
            width={innerWidth}
            height={innerHeight}
            fill="url(#grid-pattern)"
            mask="url(#grid-mask)"
          />
          <AreaClosed<ChartPrice>
            data={prices}
            x={(d) => timeScale(dateAccessor(d))}
            y={(d) => stockScale(stockAccessor(d))}
            yScale={stockScale}
            curve={curveStepAfter}
            strokeWidth={1}
            stroke="#398739"
            fill="url(#area-gradient)"
            mask="url(#chart-mask)"
          />
          <AxisBottom
            top={innerHeight + 10}
            scale={timeScale}
            tickComponent={({ formattedValue, x, y, dy }) => (
              <text
                className="text-xs"
                x={x}
                y={y}
                dy={dy}
                fill="hsl(var(--muted-foreground))"
                textAnchor="middle"
              >
                {formattedValue}
              </text>
            )}
            numTicks={Math.min(4, innerWidth / 80)}
            hideTicks
            hideAxisLine
          />
          <LinePath<ChartPrice>
            data={prices}
            x={(d) => timeScale(dateAccessor(d))}
            y={(d) => priceScale(priceAccessor(d))}
            curve={curveStepAfter}
            strokeWidth={2}
            stroke="#2b8bad"
          />
          <Bar
            width={innerWidth}
            height={innerHeight}
            onTouchStart={handleTooltip}
            onTouchMove={handleTooltip}
            onMouseMove={handleTooltip}
            onMouseLeave={() => hideTooltip()}
            onTouchEnd={() => hideTooltip()}
            stroke="hsl(var(--border))"
            strokeWidth={2}
            fill="transparent"
            mask="url(#chart-mask)"
          />
        </Group>
        {tooltipData && (
          <Bar
            width={2}
            height={innerHeight}
            x={tooltipLeft}
            pointerEvents="none"
            fill="hsl(var(--muted-foreground))"
            mask="url(#tooltip-mask)"
          />
        )}
      </svg>
      {tooltipOpen && tooltipData && (
        <TooltipWithBounds
          className="bg-background absolute flex items-center justify-center gap-1.5 rounded-md border p-2 text-sm shadow-sm"
          unstyled={true}
          left={tooltipLeft}
          offsetLeft={8}
          offsetTop={8}
        >
          <span className="font-medium tabular-nums">
            {formatCurrency(priceAccessor(tooltipData))}
            {!stockAccessor(tooltipData) ? "*" : undefined}
          </span>
          <span className="text-muted-foreground tabular-nums">
            {formatDate(new Date(dateAccessor(tooltipData)))}
          </span>
        </TooltipWithBounds>
      )}
    </Fragment>
  );
}
