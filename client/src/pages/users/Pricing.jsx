import { CheckCircle, Zap, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const plans = [
  {
    name:        'Free',
    price:       '$0',
    period:      'forever',
    description: 'Everything you need to get started.',
    border:      'border-white/[0.07]',
    badge:       null,
    badgeCls:    null,
    btnCls:      'bg-zinc-800 hover:bg-zinc-700 text-white',
    features: [
      'Up to 10 active shares',
      '200 MB per file',
      '3–5 hour expiry',
      'PIN-protected links',
      'Masonry gallery view',
      'Download all as ZIP',
    ],
  },
  {
    name:        'Pro',
    price:       '$12',
    period:      'per month',
    description: 'For professionals who share at scale.',
    border:      'border-violet-500/40',
    shadow:      'shadow-2xl shadow-violet-900/20',
    badge:       'Most Popular',
    badgeCls:    'bg-violet-600 text-white',
    btnCls:      'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/30',
    features: [
      'Unlimited active shares',
      '500 MB per file',
      'Custom expiry up to 48 h',
      'PIN-protected links',
      'Download analytics',
      'Priority support',
      'Custom branding',
    ],
  },
];

export default function Pricing() {
  return (
    <div className="w-full min-h-full px-4 sm:px-6 lg:px-8 xl:px-10 py-12">
      <div className="max-w-4xl mx-auto space-y-12">

        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
            Simple Pricing
          </h1>
          <p className="text-zinc-500 text-lg">
            No hidden fees. No lock-in. Cancel anytime.
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-6 items-start">
          {plans.map(plan => (
            <div
              key={plan.name}
              className={`relative bg-zinc-900/80 border ${plan.border}
                          ${plan.shadow ?? ''}
                          rounded-3xl p-8 flex flex-col gap-6`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2
                                 px-4 py-1 rounded-full text-xs font-bold
                                 flex items-center gap-1.5 ${plan.badgeCls}`}>
                  <Star size={11} />
                  {plan.badge}
                </div>
              )}

              {/* Plan header */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={16} className="text-violet-400" />
                  <h2 className="text-lg font-bold text-white">{plan.name}</h2>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-5xl font-black text-white">{plan.price}</span>
                  <span className="text-zinc-500 text-sm">/{plan.period}</span>
                </div>
                <p className="text-zinc-500 text-sm mt-2">{plan.description}</p>
              </div>

              {/* Features */}
              <ul className="space-y-3 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm text-zinc-300">
                    <CheckCircle size={15} className="text-violet-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                to="/register"
                className={`block text-center py-3.5 rounded-2xl
                            font-semibold text-sm transition-all
                            ${plan.btnCls}`}
              >
                Get Started with {plan.name}
              </Link>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p className="text-center text-zinc-600 text-sm">
          All plans include SSL encryption, Cloudinary CDN delivery, and email support.
        </p>
      </div>
    </div>
  );
}