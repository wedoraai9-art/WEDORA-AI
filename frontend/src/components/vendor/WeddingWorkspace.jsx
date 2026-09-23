import React from 'react';
import {
  ArrowLeft,
  CalendarDays,
  CheckSquare,
  Users,
  Wallet,
  FileText,
  Bell,
  Sparkles,
  MapPin,
  Heart,
} from 'lucide-react';

const WeddingWorkspace = ({ wedding, onBack }) => {
  if (!wedding) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#2D2638]">
        Wedding not found.
      </div>
    );
  }

  const formatDate = (date) => {
    if (!date) return 'Date not set';

    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return date;

    return parsed.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0';

    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };

  const modules = [
    {
      title: 'Overview',
      description: 'Wedding details, timeline and important information',
      icon: Heart,
    },
    {
      title: 'Tasks',
      description: 'Plan and track everything that needs to be done',
      icon: CheckSquare,
    },
    {
      title: 'Clients',
      description: 'Manage bride, groom and client communication',
      icon: Users,
    },
    {
      title: 'Budget & Payments',
      description: 'Track budget, expenses, advances and payments',
      icon: Wallet,
    },
    {
      title: 'Documents',
      description: 'Keep contracts, bills and important files organized',
      icon: FileText,
    },
    {
      title: 'Notifications',
      description: 'Important reminders and wedding updates',
      icon: Bell,
    },
    {
      title: 'AI Assistant',
      description: 'Get AI-powered help for this wedding',
      icon: Sparkles,
    },
  ];

  return (
   <div className="min-h-screen bg-[#fcf9ff] px-4 py-6 md:px-8 text-[#2D2638]">
      {/* Header */}
      <div className="max-w-7xl mx-auto">

        <button
          onClick={onBack}
          className="flex items-center gap-2  text-[#8B8194] hover:text-white transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Weddings
        </button>

        {/* Wedding Hero */}
        <div className="relative overflow-hidden rounded-3xl border border-[#eadff2] bg-white/80 shadow-[0_20px_60px_rgba(190,160,210,0.12)] backdrop-blur-xl p-6 md:p-8 mb-6">
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-pink-400/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-purple-400/10 blur-3xl" />

          <div className="relative z-10">

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full  bg-[#f6efff] text-xs  text-[#8B8194] mb-4">
                  <Heart className="w-3.5 h-3.5" />
                  Wedding Workspace
                </div>

               <h1 className="text-3xl md:text-4xl font-semibold text-[#2D2638]">
                  {wedding.wedding_name || 'Untitled Wedding'}
                </h1>

               <p className="text-[#6B6175] mt-2">
                  {wedding.bride_name || 'Bride'}{' '}
                  <span className="text-pink-300">&</span>{' '}
                  {wedding.groom_name || 'Groom'}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">

                <div className="rounded-2xl bg-[#faf7ff] border border-white/10 px-4 py-3">
                  <div className="flex items-center gap-2 text-[#8B8194] text-xs">
                    <CalendarDays className="w-4 h-4" />
                    Wedding Date
                  </div>

                  <p className="text-[#3F3748] mt-1 font-medium">
                    {formatDate(wedding.wedding_date)}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#faf7ff] border border-white/10 px-4 py-3">
                 <div className="flex items-center gap-2 text-[#8B8194] text-xs">
                    <MapPin className="w-4 h-4" />
                    Location
                  </div>

                 <p className="text-[#3F3748] mt-1 font-medium">
                    {wedding.city || 'Location not set'}
                  </p>
                </div>

              </div>

            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">

              <div className="rounded-2xl bg-white/80 border border-white/10 p-4">
                <p className="text-xs text-[#8B8194]">Guests</p>
                <p className="text-xl font-semibold text-[#3F3748] mt-1">
                  {wedding.guest_count || '—'}
                </p>
              </div>

              <div className="rounded-2xl bg-white/80 border border-[#eadff2] p-4">
                <p className="text-xs text-[#8B8194]">Budget</p>
                <p className="text-xl font-semibold text-[#3F3748] mt-1">
                  {formatCurrency(wedding.budget)}
                </p>
              </div>

              <div className="rounded-2xl bg-white/80 border border-[#eadff2] p-4">
                <p className="text-xs text-[#8B8194]">Venue</p>
                <p className="text-sm font-medium text-[#3F3748] mt-1 truncate">
                  {wedding.venue || 'Not set'}
                </p>
              </div>

              <div className="rounded-2xl bg-white/80 border border-white/10 p-4">
                <p className="text-xs text-[#8B8194]">Status</p>
                <p className="text-sm font-medium text-[#3F3748] mt-1 capitalize">
                  {(wedding.status || 'upcoming').replace('_', ' ')}
                </p>
              </div>

            </div>

          </div>
        </div>

        {/* Workspace Modules */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-[#2D2638]">
            Wedding Management
          </h2>

          <p className="text-[#6B6175] text-sm mt-1">
            Everything you need to manage this wedding in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          {modules.map((module) => {
            const Icon = module.icon;

            return (
              <button
                key={module.title}
                type="button"
                className="group text-left rounded-2xl border border-[#eadff2] bg-white/80 hover:bg-white hover:border-[#d9c7e6] shadow-[0_10px_30px_rgba(190,160,210,0.08)] transition-all duration-200 p-5"
              >

                <div className="w-11 h-11 rounded-xl bg-[#f4eafa] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Icon className="w-5 h-5 text-[#8B6AA8]" />
                </div>

                <h3 className="text-[#2D2638] font-medium">
                  {module.title}
                </h3>

                <p className="text-[#6B6175] text-sm mt-1 leading-relaxed">
                  {module.description}
                </p>

              </button>
            );
          })}

        </div>

      </div>
    </div>
  );
};

export default WeddingWorkspace;
