import { cn } from '../../utils';

interface ItemBadgeProps {
  type: 'members' | 'free' | 'trending' | 'new';
  className?: string;
}

export const ItemBadge = ({ type, className }: ItemBadgeProps) => {
  const badges = {
    members: {
      label: 'Members',
      className: 'bg-osrs-gold bg-opacity-20 text-osrs-gold',
    },
    free: {
      label: 'F2P',
      className: 'bg-blue-500 bg-opacity-20 text-blue-400',
    },
    trending: {
      label: 'Trending',
      className: 'bg-red-500 bg-opacity-20 text-red-400',
    },
    new: {
      label: 'New',
      className: 'bg-green-500 bg-opacity-20 text-green-400',
    },
  };

  const badge = badges[type];

  return (
    <span className={cn('px-2 py-0.5 text-xs rounded font-medium inline-block', badge.className, className)}>
      {badge.label}
    </span>
  );
};
