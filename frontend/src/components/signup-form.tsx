"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function SignUpForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [selectedSpecialization, setSelectedSpecialization] = useState(
    "Select your specialization"
  )

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const data = {
      DoctorName: formData.get("dr-name"),
      Email: formData.get("email"),
      specialization: selectedSpecialization,
      speacility: formData.get("qualification"),
      ContactNo: formData.get("phone"),
      password: formData.get("password"),
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const result = await response.json()
        localStorage.setItem("loggedIn", "true")
        localStorage.setItem("DoctorName", result.DoctorName) // Fix: Use server response for DoctorName
        localStorage.setItem("DoctorID", result.DoctorID) // Fix: Add DoctorID to local storage
        localStorage.setItem("Email",result.Email)
        window.location.href = "/dashboard"
      } else {
        const error = await response.json()
        alert(`Error: ${error.error || "Unknown error occurred."}`)
      }
    } catch (error) {
      console.error("Error during sign-up:", error)
      alert("An unexpected error occurred.")
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Create an account</CardTitle>
          <CardDescription>
            Sign up with your details below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="dr-name">Dr. Full Name</Label>
                <Input
                  id="dr-name"
                  name="dr-name"
                  type="text"
                  placeholder="Full Name"
                  required
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Email Address"
                  required
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="specialization">Specialization</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div>
                      <Button variant="outline" className="w-full">
                        {selectedSpecialization}
                      </Button>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={() => setSelectedSpecialization("Cardiology")}
                    >
                      Cardiology
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSelectedSpecialization("Neurology")}
                    >
                      Neurology
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSelectedSpecialization("Orthopedics")}
                    >
                      Orthopedics
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSelectedSpecialization("Pediatrics")}
                    >
                      Pediatrics
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="qualification">Qualification</Label>
                <Input
                  id="qualification"
                  name="qualification"
                  type="text"
                  placeholder="MD, MBBS, etc."
                  required
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="Phone Number"
                  required
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Password (min 8 characters)"
                  required
                />
                <span className="text-xs text-muted-foreground">
                  Must be at least 8 characters long
                </span>
              </div>
              <Button type="submit" className="w-full">
                Sign up
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our{" "}
        <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  )
}
