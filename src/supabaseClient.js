/* Clarity Engine v1.0.0 
 * Copyright © 2026. All Rights Reserved.
 * Personal Use Only.
 */
import { createClient } from '@supabase/supabase-js'

// The URL from your earlier screenshots
const supabaseUrl = 'https://qqiyusirehtktvhnfhrg.supabase.co'

// Paste the 'Publishable key' you just copied between the quotes below
const supabaseAnonKey = 'sb_publishable_mJ8abORshkTeU4sSHQVA-A_-EfZyNHR' 

export const supabase = createClient(supabaseUrl, supabaseAnonKey)