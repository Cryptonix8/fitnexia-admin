import { IconChevronLeft, IconChevronRight } from './icons'

type PaginationProps = {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

function buildPageItems(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 1) return total === 1 ? [1] : []
  if (total <= 9) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  if (current <= 5) {
    return [1, 2, 3, 4, 5, 6, 7, 'ellipsis', total]
  }

  if (current >= total - 4) {
    return [
      1,
      'ellipsis',
      total - 6,
      total - 5,
      total - 4,
      total - 3,
      total - 2,
      total - 1,
      total,
    ]
  }

  return [
    1,
    'ellipsis',
    current - 2,
    current - 1,
    current,
    current + 1,
    current + 2,
    'ellipsis',
    total,
  ]
}

export default function Pagination({ page, totalPages, onChange }: PaginationProps) {
  const pages = Math.max(1, totalPages)
  const items = buildPageItems(page, pages)
  const canPrev = page > 1
  const canNext = page < pages

  return (
    <nav className="pager" aria-label="Pagination">
      <button
        type="button"
        className="pagerNav pagerNavPrev"
        disabled={!canPrev}
        onClick={() => onChange(page - 1)}
      >
        <IconChevronLeft />
        Previous
      </button>

      <div className="pagerPages">
        {items.map((item, index) =>
          item === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className="pagerEllipsis" aria-hidden>
              ...
            </span>
          ) : (
            <button
              key={item}
              type="button"
              className={`pagerPage${item === page ? ' pagerPageActive' : ''}`}
              aria-current={item === page ? 'page' : undefined}
              onClick={() => onChange(item)}
            >
              {item}
            </button>
          ),
        )}
      </div>

      <button
        type="button"
        className="pagerNav pagerNavNext"
        disabled={!canNext}
        onClick={() => onChange(page + 1)}
      >
        Next
        <IconChevronRight />
      </button>
    </nav>
  )
}
