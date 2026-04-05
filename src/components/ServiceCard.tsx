import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, User } from 'lucide-react';

interface ServiceCardProps {
  service: {
    id: string;
    title: string;
    sellerName: string;
    price: number;
    rating: number;
    reviewCount: number;
    category: string;
    deliveryTime: string;
    coverImage?: string;
  };
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service }) => {
  return (
    <Link
      to={`/services/${service.id}`}
      className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
      <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
        <img
          src={service.coverImage || `https://picsum.photos/seed/${service.id}/800/600`}
          alt={service.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 left-4">
          <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-indigo-600 uppercase tracking-wider">
            {service.category}
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
            <User size={14} className="text-indigo-600" />
          </div>
          <span className="text-sm font-medium text-gray-600">{service.sellerName}</span>
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
          {service.title}
        </h3>

        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1 text-amber-500">
            <Star size={16} fill="currentColor" />
            <span className="text-sm font-bold">{service.rating || 'New'}</span>
            <span className="text-xs text-gray-400 font-normal">({service.reviewCount || 0})</span>
          </div>
          <div className="flex items-center gap-1 text-gray-400">
            <Clock size={16} />
            <span className="text-xs">{service.deliveryTime}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
          <span className="text-xs text-gray-400 uppercase font-bold tracking-widest">Starting at</span>
          <span className="text-xl font-black text-gray-900">${service.price}</span>
        </div>
      </div>
    </Link>
  );
};
