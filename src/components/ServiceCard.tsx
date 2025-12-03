import { CommerceService } from "@/data/commerce";

interface ServiceCardProps {
  service: CommerceService;
}

export default function ServiceCard({ service }: ServiceCardProps) {
  return (
    <a
      href={service.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-blue-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-600"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-2xl dark:bg-zinc-800">
          {service.name.charAt(0)}
        </div>
        <div className="flex-1 overflow-hidden">
          <h3 className="text-lg font-semibold text-zinc-900 group-hover:text-blue-600 dark:text-zinc-100 dark:group-hover:text-blue-400">
            {service.name}
            <span className="ml-2 text-sm font-normal text-zinc-500 dark:text-zinc-400">
              {service.nameEn}
            </span>
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
            {service.description}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex flex-wrap gap-1">
          {service.deliveryMethods.slice(0, 3).map((method, index) => (
            <span
              key={index}
              className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
            >
              🚚 {method}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1">
            <span>⏱️</span>
            <span>{service.deliveryTime}</span>
          </span>
        </div>

        <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
          <span>💰</span>
          <span>{service.minOrderAmount}</span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1">
        {service.features.slice(0, 3).map((feature, index) => (
          <span
            key={index}
            className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
          >
            {feature}
          </span>
        ))}
        {service.features.length > 3 && (
          <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            +{service.features.length - 3}
          </span>
        )}
      </div>
    </a>
  );
}
