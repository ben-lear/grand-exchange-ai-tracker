import { Link } from 'react-router-dom';
import type { Item } from '../../types';
import { formatRelativeTime } from '../../utils';

interface ItemCardProps {
  item: Item;
  showPrice?: boolean;
  currentPrice?: number;
}

export const ItemCard = ({ item, showPrice = false, currentPrice }: ItemCardProps) => {
  return (
    <Link
      to={`/items/${item.item_id}`}
      className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-osrs-gold transition-all hover:shadow-lg hover:shadow-osrs-gold/20 group"
    >
      <div className="flex items-start gap-3">
        <img
          src={item.icon_large_url || item.icon_url}
          alt={item.name}
          className="w-16 h-16 group-hover:scale-110 transition-transform"
          onError={(e) => {
            e.currentTarget.src = 'https://via.placeholder.com/64?text=OSRS';
          }}
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate group-hover:text-osrs-gold transition-colors">
            {item.name}
          </h3>
          <p className="text-sm text-gray-400 line-clamp-2 mt-1">
            {item.description}
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {item.members && (
              <span className="px-2 py-0.5 bg-osrs-gold bg-opacity-20 text-osrs-gold text-xs rounded font-medium">
                Members
              </span>
            )}
            {showPrice && currentPrice !== undefined && (
              <span className="px-2 py-0.5 bg-green-500 bg-opacity-20 text-green-400 text-xs rounded font-medium">
                {currentPrice.toLocaleString()} gp
              </span>
            )}
            <span className="text-xs text-gray-500">
              {formatRelativeTime(item.updated_at)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};
