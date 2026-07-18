-- Migration: Add citation_style and formality_preset settings to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS style_preference TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS citation_style TEXT CHECK (citation_style IN ('APA', 'MLA', 'Chicago', 'GBT7714'));
ALTER TABLE projects ADD COLUMN IF NOT EXISTS formality_preset TEXT CHECK (formality_preset IN ('Formal', 'Analytical', 'Direct'));
