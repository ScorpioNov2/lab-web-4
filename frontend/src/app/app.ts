import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthModal } from './features/auth/auth-modal/auth-modal';
import { Header } from './layout/header/header';
import { AlertContainer } from './shared/ui/alert/alert-container';
import { FallingEffect } from './theme/falling-effect/falling-effect';
import { ThemeFrame } from './theme/theme-frame/theme-frame';
import { WelcomePigeon } from './theme/welcome-pigeon/welcome-pigeon';

/** Application shell: themed page frame, header, the routed screen and the global overlays. */
@Component({
	selector: 'app-root',
	imports: [
		RouterOutlet,
		Header,
		ThemeFrame,
		FallingEffect,
		AuthModal,
		AlertContainer,
		WelcomePigeon,
	],
	templateUrl: './app.html',
	styleUrl: './app.scss',
})
export class App {}
