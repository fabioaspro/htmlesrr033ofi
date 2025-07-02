import { Routes } from '@angular/router';

export const routes: Routes = [

    {path: '', redirectTo: '/tela', pathMatch: 'full'},
    {path:'tela', loadComponent:()=> import('../app/tela/tela.component').then(c=>c.TelaComponent)},
    {path:'tela-impr-ped', loadComponent:()=> import('../app/tela-impr-ped/tela-impr-ped.component').then(c=>c.TelaImprPedComponent)},
    //{path:'tela-enc', loadComponent:()=> import('../app/tela-enc/tela-enc.component').then(c=>c.TelaEncComponent)},
];
