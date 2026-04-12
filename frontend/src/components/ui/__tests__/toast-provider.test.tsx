import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { ToastProvider, useToast } from "../toast-provider"

const DemoToastTrigger = () => {
  const { enqueue } = useToast()

  return (
    <button
      onClick={() => {
        enqueue({
          title: "Employee saved",
          description: "Changes have been persisted",
          variant: "success",
        })
      }}
      type="button"
    >
      Show toast
    </button>
  )
}

describe("ToastProvider", () => {
  it("enqueues and renders a toast with status/alert semantics and content", async () => {
    render(
      <ToastProvider>
        <DemoToastTrigger />
      </ToastProvider>,
    )

    fireEvent.click(screen.getByRole("button", { name: "Show toast" }))

    const toast =
      (await screen.findByRole("status", { name: /employee saved/i }).catch(() => null)) ??
      (await screen.findByRole("alert", { name: /employee saved/i }))

    expect(toast).toBeInTheDocument()
    expect(screen.getByText("Employee saved")).toBeInTheDocument()
    expect(screen.getByText("Changes have been persisted")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /dismiss/i })).toBeInTheDocument()
  })

  it("dismisses an existing toast when dismiss button is clicked", async () => {
    render(
      <ToastProvider>
        <DemoToastTrigger />
      </ToastProvider>,
    )

    fireEvent.click(screen.getByRole("button", { name: "Show toast" }))

    const dismissButton = await screen.findByRole("button", { name: /dismiss/i })
    fireEvent.click(dismissButton)

    expect(screen.queryByText("Employee saved")).not.toBeInTheDocument()
  })
})
