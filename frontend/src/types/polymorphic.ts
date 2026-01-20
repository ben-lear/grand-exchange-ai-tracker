import type React from 'react';

export type PolymorphicRef<T extends React.ElementType> =
    React.ComponentPropsWithRef<T>['ref'];

export type PolymorphicComponentProps<
    T extends React.ElementType,
    Props = {},
> = Props &
    { as?: T } &
    Omit<React.ComponentPropsWithoutRef<T>, keyof Props | 'as'>;

export type PolymorphicComponent<
    DefaultElement extends React.ElementType,
    Props = {},
> = <T extends React.ElementType = DefaultElement>(
    props: PolymorphicComponentProps<T, Props> & { ref?: PolymorphicRef<T> }
) => React.ReactElement | null;
