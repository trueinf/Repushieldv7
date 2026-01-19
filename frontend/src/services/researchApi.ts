import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key not configured. Research features may not work.');
}

const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export interface Research {
  id: string;
  topic: string;
  status: 'In Progress' | 'Done' | 'Failed';
  model: string;
  options: {
    depth?: 'light' | 'standard' | 'deep';
    documentContext?: string;
    clarifyingAnswers?: string;
  };
  current_step: number;
  total_steps: number;
  created_at: string;
  updated_at: string;
}

export interface ResearchReport {
  id: string;
  research_id: string;
  executive_summary: string;
  key_findings: Array<{
    text: string;
    citations: number[];
  }>;
  detailed_analysis: string;
  insights: string;
  conclusion: string;
  sources: Array<{
    url: string;
    domain: string;
    date: string;
    title?: string;
  }>;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const researchApi = {
  async createResearch(topic: string, model: string, options: {
    depth?: 'light' | 'standard' | 'deep';
    documentContext?: string;
    clarifyingAnswers?: string;
  }): Promise<Research> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('researches')
      .insert({
        topic,
        model,
        options,
        status: 'In Progress',
        current_step: 0,
        total_steps: 12,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getResearch(id: string): Promise<Research | null> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('researches')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async updateResearchProgress(id: string, step: number, status?: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const updateData: any = { current_step: step };
    if (status) {
      updateData.status = status;
    }

    const { error } = await supabase
      .from('researches')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
  },

  async getReport(researchId: string): Promise<ResearchReport | null> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('research_reports')
      .select('*')
      .eq('research_id', researchId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    return data;
  },

  async getClarifyingQuestions(topic: string, documentContext?: string, model: string = 'gemini-2.5-flash'): Promise<string[]> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase.functions.invoke('clarify-Questions-gemini', {
      body: { topic, documentContext, model },
    });

    if (error) throw error;
    return data?.questions || [];
  },

  async startDeepResearch(researchId: string, originalQuery: string, model: string, options: {
    clarifyingAnswers?: string;
    documentContext?: string;
  }): Promise<any> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase.functions.invoke('deep-Research-gemini', {
      body: {
        originalQuery,
        clarifyingAnswers: options.clarifyingAnswers,
        researchId,
        model,
        documentContext: options.documentContext,
        mode: 'comprehensive',
      },
    });

    if (error) throw error;
    return data;
  },

  async extractFileText(fileName: string, fileType: string, fileContent: string): Promise<string> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase.functions.invoke('extract-file-text', {
      body: { fileName, fileType, fileContent },
    });

    if (error) throw error;
    return data?.text || '';
  },

  async getAllResearches(status?: 'In Progress' | 'Done' | 'Failed'): Promise<Research[]> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    let query = supabase
      .from('researches')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },
};

