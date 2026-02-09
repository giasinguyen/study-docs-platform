export interface Semester {
  id: string;
  user_id: string;
  name: string;
  year: number;
  semester_number: 1 | 2 | 3;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  user_id: string;
  semester_id: string;
  name: string;
  code?: string;
  description?: string;
  color: string;
  created_at: string;
  updated_at: string;
  // Computed/joined fields
  semester?: Semester;
  document_count?: number;
}

export interface Document {
  id: string;
  user_id: string;
  subject_id: string;
  name: string;
  file_path: string;
  file_type?: string;
  file_size: number;
  description?: string;
  is_starred: boolean;
  is_deleted: boolean;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
  // Computed/joined fields
  subject?: Subject;
  tags?: Tag[];
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface DocumentTag {
  document_id: string;
  tag_id: string;
}
