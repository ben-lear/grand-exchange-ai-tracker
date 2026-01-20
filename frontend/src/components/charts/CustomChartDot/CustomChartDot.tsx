/**
 * CustomChartDot - Custom dot renderer for Recharts
 * 
 * Features:
 * - Highlights live data points with pulsing animation
 * - Standard dot for historical data
 * - Customizable fill color
 */

import { Dot } from 'recharts';

export interface CustomChartDotProps {
    cx?: number;
    cy?: number;
    payload?: {
        isLive?: boolean;
        [key: string]: unknown;
    };
    fill?: string;
    [key: string]: unknown;
}

/**
 * Custom dot component that highlights live SSE data points
 */
export function CustomChartDot(props: CustomChartDotProps) {
    const { cx, cy, payload, fill } = props;

    // Render standard dot for historical data
    if (!payload?.isLive) {
        return <Dot {...props} />;
    }

    // Render live points with pulsing animation
    return (
        <g>
            <circle cx={cx} cy={cy} r={6} fill={fill} opacity={0.3}>
                <animate attributeName="r" from="6" to="10" dur="1s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.3" to="0" dur="1s" repeatCount="indefinite" />
            </circle>
            <circle cx={cx} cy={cy} r={4} fill={fill} stroke="#fff" strokeWidth={2} />
        </g>
    );
}
