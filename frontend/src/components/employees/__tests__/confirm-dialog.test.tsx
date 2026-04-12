import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { useState } from "react"

import { ConfirmDialog } from "../confirm-dialog"

const ConfirmDialogHarness = () => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button onClick={() => setOpen(true)} type="button">
        Delete employee
      </button>

      <ConfirmDialog
        open={open}
        title="Delete employee"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {}}
        onCancel={() => setOpen(false)}
      />
    </>
  )
}

describe("ConfirmDialog", () => {
  it("moves focus to Cancel when opened", async () => {
    render(
      <ConfirmDialog
        open
        title="Delete employee"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    )

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus()
    })
  })

  it("calls onCancel when Escape is pressed and dialog is not busy", () => {
    const onCancel = vi.fn()

    render(
      <ConfirmDialog
        open
        title="Delete employee"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {}}
        onCancel={onCancel}
      />,
    )

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" })

    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it("returns focus to the previously focused trigger after closing", async () => {
    render(<ConfirmDialogHarness />)

    const trigger = screen.getByRole("button", { name: "Delete employee" })
    trigger.focus()
    expect(trigger).toHaveFocus()

    fireEvent.click(trigger)
    fireEvent.click(await screen.findByRole("button", { name: "Cancel" }))

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })

    expect(trigger).toHaveFocus()
  })
})
