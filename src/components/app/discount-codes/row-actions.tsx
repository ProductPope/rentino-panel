"use client"

import {
  CopyIcon,
  EllipsisIcon,
  PencilIcon,
  PowerIcon,
  PowerOffIcon,
  Trash2Icon,
} from "lucide-react"

import { IconButton } from "@/components/eq/icon-button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { canDelete, type DiscountCode } from "@/lib/discount-codes"

export type RowAction = "edit" | "copy" | "activate" | "deactivate" | "delete"

/** Secondary actions for one code. Deactivate and Delete confirm in a dialog (the "…"). */
export function RowActions({
  code,
  onAction,
}: {
  code: DiscountCode
  onAction: (action: RowAction, code: DiscountCode) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <IconButton
            label={`Actions for ${code.code}`}
            icon={<EllipsisIcon />}
            size="sm"
            variant="ghost"
          />
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onAction("edit", code)}>
          <PencilIcon aria-hidden="true" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction("copy", code)}>
          <CopyIcon aria-hidden="true" />
          Copy code
        </DropdownMenuItem>
        {code.active ? (
          <DropdownMenuItem onClick={() => onAction("deactivate", code)}>
            <PowerOffIcon aria-hidden="true" />
            Deactivate…
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => onAction("activate", code)}>
            <PowerIcon aria-hidden="true" />
            Activate
          </DropdownMenuItem>
        )}
        {canDelete(code) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => onAction("delete", code)}>
              <Trash2Icon aria-hidden="true" />
              Delete…
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
