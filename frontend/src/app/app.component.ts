import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from './employee.service';
import { Employee } from './employee.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html'
})
export class AppComponent {
  title = 'Employee CRUD';
  private service = inject(EmployeeService);

  employees: Employee[] = [];
  newEmployee: Employee = { name: '', email: '' };
  editing: Employee | null = null;

  ngOnInit() {
    this.refresh();
  }

  refresh() {
    this.service.list().subscribe({
      next: (list) => this.employees = list,
      error: () => this.employees = []
    });
  }

  add() {
    if (!this.newEmployee.name || !this.newEmployee.email) return;
    this.service.create(this.newEmployee).subscribe({
      next: () => {
        this.newEmployee = { name: '', email: '' };
        this.refresh();
      }
    });
  }

  startEdit(emp: Employee) {
    this.editing = { ...emp };
  }

  saveEdit() {
    if (!this.editing || !this.editing.id) return;
    this.service.update(this.editing.id, this.editing).subscribe({
      next: () => {
        this.editing = null;
        this.refresh();
      }
    });
  }

  cancelEdit() { this.editing = null; }

  remove(id: number | undefined) {
    if (!id) return;
    this.service.delete(id).subscribe({ next: () => this.refresh() });
  }
}