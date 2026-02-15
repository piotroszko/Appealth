"use client";

import { useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import type { FieldComponentProps } from "../types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";

function isValidUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed.includes(".")) return false;
  try {
    const withProtocol = trimmed.match(/^https?:\/\//) ? trimmed : `https://${trimmed}`;
    new URL(withProtocol);
    return true;
  } catch {
    return false;
  }
}

export function UrlsField({ field, label, placeholder }: FieldComponentProps) {
  const [inputValue, setInputValue] = useState("");
  const [inputError, setInputError] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editError, setEditError] = useState("");
  const editRef = useRef<HTMLInputElement>(null);
  const urls: string[] = field.state.value ?? [];

  function addUrl() {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    if (!isValidUrl(trimmed)) {
      setInputError("Must be a valid URL (e.g. example.com)");
      return;
    }
    if (urls.includes(trimmed)) {
      setInputError("Already added");
      return;
    }
    field.handleChange([...urls, trimmed]);
    setInputValue("");
    setInputError("");
  }

  function removeUrl(index: number) {
    field.handleChange(urls.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
  }

  function startEdit(index: number) {
    setEditingIndex(index);
    setEditValue(urls[index]);
    setEditError("");
    setTimeout(() => editRef.current?.focus(), 0);
  }

  function commitEdit() {
    if (editingIndex === null) return;
    const trimmed = editValue.trim();
    if (!trimmed) {
      removeUrl(editingIndex);
      setEditingIndex(null);
      return;
    }
    if (!isValidUrl(trimmed)) {
      setEditError("Must be a valid URL (e.g. example.com)");
      return;
    }
    const duplicate = urls.findIndex((u, i) => u === trimmed && i !== editingIndex);
    if (duplicate !== -1) {
      setEditError("Already added");
      return;
    }
    const updated = [...urls];
    updated[editingIndex] = trimmed;
    field.handleChange(updated);
    setEditingIndex(null);
    setEditError("");
  }

  function cancelEdit() {
    setEditingIndex(null);
    setEditError("");
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={field.name}>{label}</Label>

      {urls.length > 0 && (
        <Table>
          <TableBody>
            {urls.map((url, index) => (
              <TableRow key={url}>
                <TableCell className="p-0">
                  {editingIndex === index ? (
                    <div>
                      <Input
                        ref={editRef}
                        className="border-0 shadow-none focus-visible:ring-0"
                        value={editValue}
                        onChange={(e) => {
                          setEditValue(e.target.value);
                          setEditError("");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            commitEdit();
                          } else if (e.key === "Escape") {
                            cancelEdit();
                          }
                        }}
                        onBlur={commitEdit}
                      />
                      {editError && (
                        <p className="px-2 pb-1 text-xs text-red-500">{editError}</p>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="w-full cursor-text px-2 py-2 text-left text-xs"
                      onClick={() => startEdit(index)}
                    >
                      {url}
                    </button>
                  )}
                </TableCell>
                <TableCell className="w-10 p-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeUrl(index)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <div className="flex items-start gap-2">
        <div className="flex-1">
          <Input
            id={field.name}
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setInputError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addUrl();
              }
            }}
          />
          {inputError && (
            <p className="mt-1 text-xs text-red-500">{inputError}</p>
          )}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addUrl}>
          <Plus className="size-3.5" />
          Add
        </Button>
      </div>

      {field.state.meta.errors.map((error) => (
        <p key={error?.message} className="text-red-500">
          {error?.message}
        </p>
      ))}
    </div>
  );
}
