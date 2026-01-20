/**
 * Tests for CustomChartDot component
 */

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CustomChartDot } from './CustomChartDot';

describe('CustomChartDot', () => {
    it('should render standard dot for non-live data', () => {
        const { container } = render(
            <svg>
                <CustomChartDot cx={50} cy={50} payload={{ isLive: false }} fill="#10b981" />
            </svg>
        );

        // Should not render the pulsing animation group for non-live data
        expect(container.querySelector('g')).not.toBeInTheDocument();
    });

    it('should render standard dot when payload is undefined', () => {
        const { container } = render(
            <svg>
                <CustomChartDot cx={50} cy={50} fill="#10b981" />
            </svg>
        );

        // Should not render the pulsing animation group
        expect(container.querySelector('g')).not.toBeInTheDocument();
    });

    it('should render live dot with animation for live data', () => {
        const { container } = render(
            <svg>
                <CustomChartDot cx={50} cy={50} payload={{ isLive: true }} fill="#10b981" />
            </svg>
        );

        // Should render two circles for pulsing effect
        const circles = container.querySelectorAll('circle');
        expect(circles.length).toBeGreaterThanOrEqual(2);
    });

    it('should render with correct coordinates', () => {
        const { container } = render(
            <svg>
                <CustomChartDot cx={100} cy={200} payload={{ isLive: true }} fill="#10b981" />
            </svg>
        );

        const circles = container.querySelectorAll('circle');
        circles.forEach(circle => {
            expect(circle.getAttribute('cx')).toBe('100');
            expect(circle.getAttribute('cy')).toBe('200');
        });
    });

    it('should apply correct fill color', () => {
        const { container } = render(
            <svg>
                <CustomChartDot cx={50} cy={50} payload={{ isLive: true }} fill="#ef4444" />
            </svg>
        );

        const circles = container.querySelectorAll('circle');
        const hasCorrectFill = Array.from(circles).some(
            circle => circle.getAttribute('fill') === '#ef4444'
        );
        expect(hasCorrectFill).toBe(true);
    });

    it('should have animation for live dots', () => {
        const { container } = render(
            <svg>
                <CustomChartDot cx={50} cy={50} payload={{ isLive: true }} fill="#10b981" />
            </svg>
        );

        const animations = container.querySelectorAll('animate');
        expect(animations.length).toBeGreaterThan(0);
    });

    it('should handle missing coordinates gracefully', () => {
        const { container } = render(
            <svg>
                <CustomChartDot payload={{ isLive: true }} fill="#10b981" />
            </svg>
        );

        expect(container.querySelector('g')).toBeInTheDocument();
    });

    it('should render inner circle with white stroke for live data', () => {
        const { container } = render(
            <svg>
                <CustomChartDot cx={50} cy={50} payload={{ isLive: true }} fill="#10b981" />
            </svg>
        );

        const circles = container.querySelectorAll('circle');
        const hasWhiteStroke = Array.from(circles).some(
            circle => circle.getAttribute('stroke') === '#fff'
        );
        expect(hasWhiteStroke).toBe(true);
    });

    it('should set correct radius for pulsing circle', () => {
        const { container } = render(
            <svg>
                <CustomChartDot cx={50} cy={50} payload={{ isLive: true }} fill="#10b981" />
            </svg>
        );

        const circles = container.querySelectorAll('circle');
        const hasPulsingCircle = Array.from(circles).some(
            circle => circle.getAttribute('r') === '6'
        );
        expect(hasPulsingCircle).toBe(true);
    });

    it('should set correct radius for inner circle', () => {
        const { container } = render(
            <svg>
                <CustomChartDot cx={50} cy={50} payload={{ isLive: true }} fill="#10b981" />
            </svg>
        );

        const circles = container.querySelectorAll('circle');
        const hasInnerCircle = Array.from(circles).some(
            circle => circle.getAttribute('r') === '4'
        );
        expect(hasInnerCircle).toBe(true);
    });
});
