import Link from "next/link";

interface BreadcrumbItem {
  href?: string;
  label: string;
}

interface SeoBreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function SeoBreadcrumbs({ items }: SeoBreadcrumbsProps) {
  return (
    <nav aria-label="breadcrumb" className="page-breadcrumbs">
      <ol>
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`}>
            {item.href ? <Link href={item.href}>{item.label}</Link> : <span>{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
