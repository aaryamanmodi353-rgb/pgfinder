import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MetadataPreview, MaskedValue, StatusPill } from "@/components/ui/primitives";
import { SubmissionChecklist } from "@/components/submission-checklist";

describe("console components", () => {
  it("renders status values safely and humanizes labels", () => {
    render(
      <>
        <StatusPill status="callback_requested" />
        <StatusPill status={undefined} />
      </>,
    );
    expect(screen.getByText("Callback Requested")).toBeInTheDocument();
    expect(screen.getByText("Unknown")).toBeInTheDocument();
  });
  it("masks phone numbers by default", () => {
    render(<MaskedValue value="+91 98765 43210" />);
    expect(screen.getByText("•••• ••• 3210")).toBeInTheDocument();
    expect(screen.queryByText("+91 98765 43210")).not.toBeInTheDocument();
  });
  it("explains an empty metadata mapping without printing null values", () => {
    render(<MetadataPreview payload={{}} />);
    expect(screen.getByText("Metadata mapping is not configured")).toBeInTheDocument();
  });
  it("keeps the submission checklist to the three required items", () => {
    const items = [
      { key: "recordings", label: "Test call recordings", complete: false },
      { key: "account_email", label: "CallKaro account email", complete: false },
      { key: "agent_name", label: "Exact agent name created on CallKaro", complete: false },
    ];
    render(<SubmissionChecklist items={items} />);
    expect(screen.getAllByText("Needed")).toHaveLength(3);
    expect(screen.getByText("Test call recordings")).toBeInTheDocument();
    expect(screen.queryByText(/transcript/i)).not.toBeInTheDocument();
  });
});
