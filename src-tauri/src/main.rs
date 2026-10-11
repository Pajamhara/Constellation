// Évite la fenêtre de console sous Windows en version finale.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tableau_de_bord_lib::run()
}
