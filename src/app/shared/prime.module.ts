import { NgModule } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService } from 'primeng/api';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TimelineModule } from 'primeng/timeline';
import { CardModule } from 'primeng/card';
import { SelectButtonModule } from 'primeng/selectbutton';
import { BadgeModule } from 'primeng/badge';
import { RadioButtonModule } from 'primeng/radiobutton';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { TabViewModule } from 'primeng/tabview';
import { TableModule } from 'primeng/table';
import { TreeTableModule } from 'primeng/treetable';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CalendarModule } from 'primeng/calendar';
import { ProgressBarModule } from 'primeng/progressbar';
import { SplitterModule } from 'primeng/splitter';
import { InputTextModule } from 'primeng/inputtext';
import { ToolbarModule } from 'primeng/toolbar';
import { MessagesModule } from 'primeng/messages';
import { MessageModule } from 'primeng/message';
import { ColorPickerModule } from 'primeng/colorpicker';
import { VirtualScrollerModule } from 'primeng/virtualscroller';
import { ContextMenuModule } from 'primeng/contextmenu';
import { AccordionModule } from 'primeng/accordion';

import { ToastModule } from 'primeng/toast';
import { SliderModule } from 'primeng/slider';
import { MultiSelectModule } from 'primeng/multiselect';

import { FileUploadModule } from 'primeng/fileupload';
import { RatingModule } from 'primeng/rating';
import { TagModule } from 'primeng/tag';
import { SplitButtonModule } from 'primeng/splitbutton';
import { ScrollPanelModule } from 'primeng/scrollpanel';

import { MenuModule } from 'primeng/menu';


import { TreeModule } from 'primeng/tree';
import { ChartModule } from 'primeng/chart';
import { ToastComponent } from './toast/toast.component';


@NgModule({
    imports: [
        ButtonModule,
        DialogModule,
        ConfirmDialogModule,
        TimelineModule,
        CardModule,
        SelectButtonModule,
        BadgeModule,
        RadioButtonModule,
        AvatarModule,
        AvatarGroupModule,
        TabViewModule,
        TableModule,
        TreeTableModule,
        DropdownModule,
        InputNumberModule,
        InputTextareaModule,
        CheckboxModule,
        TooltipModule,
        ProgressSpinnerModule,
        CalendarModule,
        ProgressBarModule,
        SplitterModule,
        InputTextModule,
        ToolbarModule,
        MessagesModule,
        MessageModule,
        ColorPickerModule,
        VirtualScrollerModule,
        ContextMenuModule,
        AccordionModule,
        TagModule,

        ToastModule,
        SliderModule,
        MultiSelectModule,
        FileUploadModule,
        RatingModule,
        SplitButtonModule,
        TreeModule,
        MenuModule,
        ChartModule,
    ],
    exports: [
        ButtonModule,
        DialogModule,
        ConfirmDialogModule,
        TimelineModule,
        CardModule,
        SelectButtonModule,
        BadgeModule,
        RadioButtonModule,
        AvatarModule,
        AvatarGroupModule,
        TabViewModule,
        TableModule,
        TreeTableModule,
        DropdownModule,
        InputNumberModule,
        InputTextareaModule,
        CheckboxModule,
        TooltipModule,
        ProgressSpinnerModule,
        CalendarModule,
        ProgressBarModule,
        SplitterModule,
        InputTextModule,
        ToolbarModule,
        MessagesModule,
        MessageModule,
        ColorPickerModule,
        VirtualScrollerModule,
        ContextMenuModule,
        AccordionModule,
        TagModule,

        ToastModule,
        SliderModule,
        MultiSelectModule,
        FileUploadModule,
        RatingModule,
        SplitButtonModule,
        ScrollPanelModule,
        TreeModule,
        MenuModule,
        ChartModule,
    ],
    providers: [ConfirmationService, MessageService],
    declarations: [
      ToastComponent
    ],
})
export class PrimeModule { }
