import { FC, ReactNode } from 'react';
import { Card, CardContent } from './card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  description?: string;
}

export const StatCard: FC<StatCardProps> = ({
  title,
  value,
  icon,
  description,
}) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold mt-2">{value}</p>
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
          </div>
          {icon && <div className="text-gray-400">{icon}</div>}
        </div>
      </CardContent>
    </Card>
  );
};
